const Command = require('../../core/Command');
const { globalOptions, commonPackageOptions, forceOption } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const crawler = require('../crawler');
const downloader = require('./downloader');

class NpmDownloadPackageJsonCommand extends Command {
  get definition() {
    return {
      name: 'package-json',
      flags: '<uri>',
      description: 'download tarballs based on a package.json',
      options: [
        forceOption,
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { uri, force, logger } = options;
    const packageJson = await retrieveFile(uri, { logger });
    const tarballsSet = await crawler.getPackageJsonDependencies({
      packageJson,
      devDependencies: options.devDependencies,
      peerDependencies: options.peerDependencies,
      registry: options.registry,
      logger,
    });
    return downloader.downloadFromIterable(tarballsSet, options.directory, { force, logger });
  }
}

module.exports = NpmDownloadPackageJsonCommand;
