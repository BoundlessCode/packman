const Command = require('../../core/Command');
const { globalOptions, commonPackageOptions } = require('../../core/commandOptions');
const { generatePackageJson } = require('./npm-search');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadSearchCommand extends Command {
  get definition() {
    return {
      name: 'search',
      flags: '<keyword>',
      description: 'download tarballs based on a npm registry search results',
      options: [
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { keyword, logger } = options;
    const packageJson = await generatePackageJson({
      keyword,
      registry: options.registry,
    });
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

module.exports = NpmDownloadSearchCommand;
