import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, registryOption, CatalogFileOption } from '../../../core/commandOptions';
import { Fetcher } from '../../../core/fetcher';
import Cataloger from '../../../core/catalog/Cataloger';
import { getCurrentRegistry, isValidPackageName, getAllEndpointUrl, getPackageUrl } from '../npm-utils';
import NpmPackageManifest from '../NpmPackageManifest';
import { NpmRegistryOption } from '../npm-options';

export type NpmCatalogAllCommandOptions =
  NpmRegistryOption
  & CatalogFileOption
  & GlobalOptions
  & {
  }

export default class NpmCatalogAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      flags: '[catalogFile]',
      description: 'create a catalog of all the packages hosted by the registry',
      options: [
        registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCatalogAllCommandOptions) {
    const { lenientSsl, logger } = options;
    const registry = options.registry || await getCurrentRegistry(options);
    const allEndpointUrl = getAllEndpointUrl(registry, options);
    const fetcher = new Fetcher({
      lenientSsl,
    });
    const { body: searchResults } = await fetcher.fetch<object>({ ...options, uri: allEndpointUrl, responseType: 'json' });

    const cataloger = new Cataloger(options);
    await cataloger.initialize();

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
