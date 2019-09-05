import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, CatalogFileOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import Cataloger from '../../../core/catalog/Cataloger';
import { EntryInfo } from '../../../core/catalog/types';
import PackageInfo from '../../../core/PackageInfo';
import { getCurrentRegistry, isValidPackageName, getAllEndpointUrl, getPackageUrl, packageVersionExists } from '../npm-utils';
import NpmPackageManifest from '../NpmPackageManifest';
import { NpmSourceRegistryOption, NpmTargetRegistryOption, sourceRegistryOption, targetRegistryOption } from '../npm-options';
import { SearchResults } from '../crawler';

export type NpmCatalogOverlapCommandOptions =
  NpmSourceRegistryOption
  & NpmTargetRegistryOption
  & CatalogFileOption
  & GlobalOptions
  & {
  }

export default class NpmCatalogOverlapCommand implements Command {
  get definition() {
    return {
      name: 'overlap',
      flags: '[catalogFile]',
      description: 'create a catalog of the versioned packages in both specified registries',
      options: [
        sourceRegistryOption,
        targetRegistryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCatalogOverlapCommandOptions) {
    // Scan the target registry first because we assume it's smaller. The idea is that the
    // source registry will probably usually be npmjs.org, or another huge registry. Also,
    // the target registry is more likely to have an "all" endpoint or other convenient mechanism.

    const { source, logger } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`scanning target registry ${target}`);

    const targetCataloger = await createCatalog({ ...options, registry: target });

    const overlapCataloger = new Cataloger(options);
    await overlapCataloger.initialize();

    logger.info(`start comparing to source registry ${source}`);
    for (const entry of targetCataloger.stream<EntryInfo>()) {
      const packageInfo: PackageInfo = {
        packageName: entry.name,
        packageVersion: entry.version,
        registry: source,
      };
      try {
        const exists = await packageVersionExists(packageInfo, options);
        if (exists) {
          overlapCataloger.catalog(entry);
          logger.info(`${entry.name}@${entry.version}`.yellow);
        }
      }
      catch(error) {
        logger.info('package not found', `${packageInfo.packageName}@${packageInfo.packageVersion}`.magenta, 'message' in error ? error.message.red : error);
      }
    }
    logger.info(`done comparing to source registry ${source}`);
  }
}

async function createCatalog(options): Promise<Cataloger> {
  const { registry, logger } = options;
  const uri = getAllEndpointUrl(registry, options);
  const { body: searchResults } = await fetch<SearchResults>({ ...options, uri, responseType: 'json' });

  const targetCataloger = new Cataloger(options);
  await targetCataloger.initialize();

  for (const packageName of Object.keys(searchResults)) {
    logger.debug(`cataloging package ${packageName}`);

    if (!isValidPackageName(packageName)) {
      logger.debug(`skipping because package name is invalid: ${packageName}`);
      continue;
    }

    const packageUrl = getPackageUrl({ packageName, registry });
    const { body: { versions } } = await fetch<NpmPackageManifest>({ ...options, uri: packageUrl, responseType: 'json' });

    if (versions) {
      for (const packageVersion of Object.keys(versions)) {
        logger.debug(`catalogin package version ${packageName} ${packageVersion}`);
        targetCataloger.catalog({
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

  return targetCataloger;
}