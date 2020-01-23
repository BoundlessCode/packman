import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, CatalogFileOption } from '../../../core/commandOptions';
import { Fetcher } from '../../../core/fetcher';
import Cataloger from '../../../core/catalog/Cataloger';
import EntryInfo from "../../../core/catalog/EntryInfo";
import FileCatalogPersister from '../../../core/catalog/FileCatalogPersister';
import PackageInfo from '../../../core/PackageInfo';
import { getCurrentRegistry, isValidPackageName, getAllEndpointUrl, getPackageUrl, packageVersionExists } from '../npm-utils';
import NpmPackageManifest from '../NpmPackageManifest';
import { NpmSourceRegistryOption, NpmTargetRegistryOption, sourceRegistryOption, targetRegistryOption } from '../npm-options';
import { SearchResults } from '../crawler';

export type NpmCatalogSameCommandOptions =
  NpmSourceRegistryOption
  & NpmTargetRegistryOption
  & CatalogFileOption
  & GlobalOptions
  & {
    sameCatalogFile: string
    diffCatalogFile: string
  }

type Catalogers = {
  targetCataloger: Cataloger
  sameCataloger?: Cataloger
  diffCataloger?: Cataloger
}

export default class NpmCatalogCompareCommand implements Command {
  get definition() {
    return {
      name: 'compare',
      description: 'create a catalog of the versioned packages in both specified registries, optimized for a smaller target registry',
      options: [
        '--same <sameCatalogFile>',
        '--diff <diffCatalogFile>',
        sourceRegistryOption,
        targetRegistryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCatalogSameCommandOptions) {
    // Scan the target registry first because we assume it's smaller. The idea is that the
    // source registry will probably usually be npmjs.org, or another huge registry. Also,
    // the target registry is more likely to have an "all" endpoint or other convenient mechanism.

    const { source, sameCatalogFile, diffCatalogFile, logger } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`scanning target registry ${target}`);

    const catalogers: Catalogers = {
      targetCataloger: await createCataloger({ ...options, registry: target }),
      sameCataloger: sameCatalogFile ? new Cataloger({ ...options, catalogFile: sameCatalogFile, logActionsAsInfo: true }) : undefined,
      diffCataloger: diffCatalogFile ? new Cataloger({ ...options, catalogFile: diffCatalogFile, logActionsAsInfo: true }) : undefined,
    };

    await compareRegistries(catalogers, options);

    // await storeResults(catalogers, options);
  }
}

async function createCataloger(options: NpmCatalogSameCommandOptions): Promise<Cataloger> {
  const { registry, lenientSsl, logger } = options;
  const uri = getAllEndpointUrl(registry, options);
  const fetcher = new Fetcher({
    lenientSsl,
  });
  const { body: searchResults } = await fetcher.fetch<SearchResults>({ ...options, uri, responseType: 'json' });

  const cataloger = new Cataloger({ ...options, mode: 'memory' });
  const { catalogFile } = options;
  const filePersister = new FileCatalogPersister({ catalogFile, logger }, cataloger.persister);
  await cataloger.initialize(filePersister);

  for (const packageName of Object.keys(searchResults)) {
    logger.debug(`cataloging package ${packageName}`);

    if (!isValidPackageName(packageName)) {
      logger.debug(`skipping because package name is invalid: ${packageName}`);
      continue;
    }

    const packageUrl = getPackageUrl({ packageName, registry });
    const { body: { versions } } = await fetcher.fetch<NpmPackageManifest>({ ...options, uri: packageUrl, responseType: 'json' });

    if (versions) {
      for (const packageVersion of Object.keys(versions)) {
        logger.debug(`catalogin package version ${packageName} ${packageVersion}`);
        await cataloger.catalog({
          name: packageName,
          version: packageVersion,
        });
      }
    }
    else {
      logger.debug(`no versions to catalog were found for ${packageName}`);
    }

    logger.debug(`finished cataloging ${packageName}`);
  }

  return cataloger;
}

async function compareRegistries(catalogers: Catalogers, options: NpmCatalogSameCommandOptions) {
  const { logger, source } = options;
  const { targetCataloger, sameCataloger, diffCataloger } = catalogers;

  logger.info(`start comparing to source registry ${source}`);

  for (const entry of targetCataloger.stream<EntryInfo>()) {
    const packageInfo: PackageInfo = {
      packageName: entry.name,
      packageVersion: entry.version,
      registry: source,
    };

    let exists = false;
    try {
      exists = await packageVersionExists(packageInfo, options);
    }
    catch (error) {
      logger.debug('package not found', `${packageInfo.packageName}@${packageInfo.packageVersion}`.magenta, 'message' in error ? error.message.red : error);
    }

    const summary = `${entry.name}@${entry.version}`;
    if (exists) {
      if (sameCataloger) {
        await sameCataloger.catalog(entry);
      }
      logger.info('same:'.green, summary);
    }
    else if (!exists) {
      if (diffCataloger) {
        await diffCataloger.catalog(entry);
      }
      logger.info('diff:'.red, summary);
    }
  }

  logger.info(`done comparing to source registry ${source}`);
  if (sameCataloger) {
    logger.info('same'.green, 'results stored in', sameCataloger.persister.target.magenta);
  }
  if (diffCataloger) {
    logger.info('diff'.red, 'results stored in', diffCataloger.persister.target.magenta);
  }
}

// async function storeResults(cataloger: Cataloger, options: NpmCatalogSameCommandOptions) {
//   const { logger } = options;

//   const samePersister = new FileCatalogPersister({
//     catalogFile: options.catalogFile,
//     logger,
//   }, cataloger.persister);

//   await cataloger.saveTo(samePersister);

//   logger.info('stored the results in', samePersister.target.magenta);
// }
