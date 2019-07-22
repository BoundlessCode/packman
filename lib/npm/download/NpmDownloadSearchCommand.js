const Command = require('../../core/Command');
const { commonPackageOptions } = require('../../core/commandOptions');
const { generatePackageJson } = require('./npm-search');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadSearchCommand extends Command {
  get definition() {
    return {
      name: 'search <keyword>',
      description: 'download tarballs based on a npm registry search results',
      options: [
        ...commonPackageOptions,
      ],
      action: (keyword, command) => this.execute({ keyword, ...command }),
    };
  }

  async execute(options = {}) {
    const { keyword } = options;
    const packageJson = await generatePackageJson({
      keyword,
      registry: options.registry,
    });
    const tarballsSet = await crawler.getPackageJsonDependencies({
      packageJson,
      devDependencies: options.devDependencies,
      peerDependencies: options.peerDependencies,
      registry: options.registry,
    });
    return downloader.downloadFromIterable(tarballsSet, options.directory);
  }
}

module.exports = NpmDownloadSearchCommand;
