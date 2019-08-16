const Command = require('../../core/Command');
const { globalOptions, registryOption, directoryOption, forceOption } = require('../../core/commandOptions');
const Cataloger = require('../../core/Cataloger');
const { getCurrentRegistry, getPackageUrl } = require('../npm-utils');
const downloader = require('./downloader');

class NpmDownloadCatalogCommand extends Command {
  get definition() {
    return {
      name: 'catalog',
      flags: '[catalogFile]',
      description: 'download tarballs for packages listed in the specified catalog file',
      options: [
        registryOption,
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { catalogFile, force, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const cataloger = new Cataloger({ catalogFile, logger });
    logger.debug(`Using catalog file: ${cataloger.fullPath}`);
    if (cataloger.exists()) {
      await cataloger.initialize();
      const packages = Array.from(cataloger.stream((entry) => {
        const url = getPackageUrl({
          packageName: entry.name,
          packageVersion: entry.version,
          registry,
        });
        return url.href;
      }));
      return downloader.downloadFromIterable(packages, options.directory, { force, logger });
    }
    else {
      logger.info(`Could not find a catalog file at ${fullPath}`);
    }
  }
}

module.exports = NpmDownloadCatalogCommand;
