const Command = require('../../core/Command');
const { globalOptions, commonPackageOptions } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadPackageJsonCommand extends Command {
  get definition() {
    return {
      name: 'package-json',
      flags: '<uri>',
      description: 'download tarballs based on a package.json',
      options: [
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { uri, logger } = options;
    const packageJson = await retrieveFile(uri, { logger });
    const tarballsSet = await crawler.getPackageJsonDependencies({
      packageJson,
      devDependencies: options.devDependencies,
      peerDependencies: options.peerDependencies,
      registry: options.registry,
      logger,
    });
    return downloader.downloadFromIterable(tarballsSet, options.directory, logger);
  }
}

module.exports = NpmDownloadPackageJsonCommand;
