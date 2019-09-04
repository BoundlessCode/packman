import Command from '../../../core/Command';
import { globalOptions, registryOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import Cataloger from '../../../core/Cataloger';
import { CommandExecuteOptions } from '../../../core/Command';
import { getCurrentRegistry, isValidPackageName, getAllEndpointUrl, getPackageUrl } from '../npm-utils';
import NpmPackageManifest from '../NpmPackageManifest';
import { NpmRegistryOption } from '../npm-options';

export type NpmCatalogAllCommandOptions =
  NpmRegistryOption
  & CommandExecuteOptions & {
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
    const { logger } = options;
    const registry = options.registry || await getCurrentRegistry(options);
    const allEndpointUrl = getAllEndpointUrl(registry, options);
    const { body: searchResults } = await fetch<object>({ ...options, uri: allEndpointUrl, responseType: 'json' });

    const cataloger = new Cataloger(options);
    await cataloger.initialize();

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
