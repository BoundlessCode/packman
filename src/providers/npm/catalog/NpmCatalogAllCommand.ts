import Command from '../../../core/Command';
import { globalOptions, registryOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import Cataloger from '../../../core/Cataloger';
import { getCurrentRegistry, isValidPackageName, getAllEndpointUrl, getPackageUrl } from '../npm-utils';
import { CommandExecuteOptions } from '../../../core/Command';
import PackageInfo from '../../../core/PackageInfo';
import NpmPackageManifest from '../NpmPackageManifest';

export type NpmCatalogAllCommandOptions = CommandExecuteOptions & {
  registry: string
  catalogFile: string
}

export default class NpmCatalogAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      flags: '[catalogFile]',
      description: 'download tarballs for all packages hosted by the registry',
      options: [
        registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCatalogAllCommandOptions) {
    const { catalogFile, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const allEndpointUrl = getAllEndpointUrl(registry, { logger });
    const { body: searchResults } = await fetch<object>({ uri: allEndpointUrl, responseType: 'json', logger });

    const cataloger = new Cataloger({ catalogFile, logger });
    await cataloger.initialize();

    for (const packageName of Object.keys(searchResults)) {
      logger.debug(`cataloging package ${packageName}`);

      if (!isValidPackageName(packageName)) {
        logger.debug(`skipping because package name is invalid: ${packageName}`);
        continue;
      }

      const packageUrl = getPackageUrl({ packageName, registry });
      const { body: { versions } } = await fetch<NpmPackageManifest>({ uri: packageUrl, responseType: 'json', logger });

      if (versions) {
        for (const packageVersion of Object.keys(versions)) {
          logger.debug(`indexing package version ${packageName} ${packageVersion}`);
          cataloger.catalog({
            name: packageName,
            version: packageVersion,
          });
        }
      }
      else {
        logger.debug(`no versions to index were found for ${packageName}`);
      }

      logger.debug(`finished indexing ${packageName}`);
    }
  }
}
