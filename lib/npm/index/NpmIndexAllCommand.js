const Command = require('../../core/Command');
const { globalOptions, registryOption } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const Tracker = require('../../core/Tracker');
const { getCurrentRegistry, isValidPackageName, NPM_ALL_ENDPOINT, getPackageUrl } = require('../npm-utils');

class NpmIndexAllCommand extends Command {
  get definition() {
    return {
      name: 'all',
      flags: '[indexFile]',
      description: 'download tarballs for all packages hosted by the registry',
      options: [
        registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { indexFile, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const url = new URL(NPM_ALL_ENDPOINT, registry);
    const searchResults = await retrieveFile(url, { json: true, logger });

    const tracker = new Tracker({ indexFile, logger });
    await tracker.initialize();

    for (const packageName of Object.keys(searchResults)) {
      logger.debug(`indexing package ${packageName}`);

      if (!isValidPackageName(packageName)) {
        logger.debug(`skipping because package name is invalid: ${packageName}`);
        continue;
      }

      const packageUrl = getPackageUrl({ packageName, registry });
      const packageInfo = await retrieveFile(packageUrl, { json: true, logger });

      for (const packageVersion of Object.keys(packageInfo.versions)) {
        logger.debug(`indexing package version ${packageName} ${packageVersion}`);
        tracker.track({
          name: packageName,
          version: packageVersion,
        });
      }

      logger.debug(`finished indexing ${packageName}`);
    }
  }
}

module.exports = NpmIndexAllCommand;
