const Command = require('../../core/Command');
const { globalOptions, registryOption, directoryOption, forceOption } = require('../../core/commandOptions');
const Tracker = require('../../core/Tracker');
const { getCurrentRegistry, getPackageUrl } = require('../npm-utils');
const downloader = require('./downloader');

class NpmDownloadIndexCommand extends Command {
  get definition() {
    return {
      name: 'index',
      flags: '[indexFile]',
      description: 'download tarballs for packages listed in the specified index file',
      options: [
        registryOption,
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { indexFile, force, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const tracker = new Tracker({ indexFile, logger });
    logger.debug(`Using index file: ${tracker.fullPath}`);
    if (tracker.exists()) {
      await tracker.initialize();
      const packages = Array.from(tracker.stream((entry) => {
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
      logger.info(`Could not find an index file at ${fullPath}`);
    }
  }
}

module.exports = NpmDownloadIndexCommand;
