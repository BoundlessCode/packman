const Command = require('../../core/Command');
const { globalOptions, commonPackageOptions, registryOption, forceOption } = require('../../core/commandOptions');
const crawler = require('../crawler');
const downloader = require('./downloader');

class NpmDownloadPackageCommand extends Command {
  get definition() {
    return {
      name: 'package',
      flags: '<name> [version]',
      description: 'download tarballs based on a package and a version',
      options: [
        registryOption,
        forceOption,
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const {
      name,
      version,
      devDependencies,
      peerDependencies,
      registry,
      directory,
      force,
      logger,
    } = options;

    const tarballsSet = await crawler.getDependencies({
      name,
      version,
      devDependencies,
      peerDependencies,
      registry,
      logger,
    });

    return downloader.downloadFromIterable(tarballsSet, directory, { force, logger });
  }
}

module.exports = NpmDownloadPackageCommand;
