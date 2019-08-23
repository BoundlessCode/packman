const Command = require('../../../core/Command');
const { globalOptions, commonPackageOptions, registryOption, forceOption } = require('../../../core/commandOptions');
const crawler = require('../crawler');
const downloader = require('./downloader');
const BundleZipCreateCommand = require('../../bundle/zip/BundleZipCreateCommand');

class NpmDownloadPackageCommand extends Command {
  get definition() {
    return {
      name: 'package',
      flags: '<name> [version]',
      description: 'download tarballs based on a package and a version',
      options: [
        registryOption,
        '--bundle [bundleName]',
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
      bundleName,
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

    const result = await downloader.downloadFromIterable(tarballsSet, directory, { force, logger });

    if(bundleName) {
      const bundleCommand = new BundleZipCreateCommand();
      await bundleCommand.execute({ directory, bundleName, logger })
    }
    return result;
  }
}

module.exports = NpmDownloadPackageCommand;
