import Command from '../../../core/Command';
import { globalOptions, registryOption } from '../../../core/commandOptions';
import { fetchFile } from '../../../core/fetcher';
import Cataloger from '../../../core/Cataloger';
import { getCurrentRegistry, isValidPackageName, getAllEndpointUrl, getPackageUrl } from '../npm-utils';
import { CommandExecuteOptions } from '../../../core/Command';

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
    const url = getAllEndpointUrl(registry, { logger });
    const searchResults = await fetchFile(url, { json: true, logger });

    const cataloger = new Cataloger({ catalogFile, logger });
    await cataloger.initialize();

    for (const packageName of Object.keys(searchResults)) {
      logger.debug(`cataloging package ${packageName}`);

      if (!isValidPackageName(packageName)) {
        logger.debug(`skipping because package name is invalid: ${packageName}`);
        continue;
      }

      const packageUrl = getPackageUrl({ packageName, registry });
      const packageInfo = await fetchFile(packageUrl, { json: true, logger });

      for (const packageVersion of Object.keys(packageInfo.versions)) {
        logger.debug(`indexing package version ${packageName} ${packageVersion}`);
        cataloger.catalog({
          name: packageName,
          version: packageVersion,
        });
      }

      logger.debug(`finished indexing ${packageName}`);
    }
  }
}
