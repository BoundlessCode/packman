const Command = require('../../core/Command');
const { generatePackageJson } = require('./npm-search');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadSearchCommand extends Command {
  constructor(keyword, options = {}) {
    this.keyword = keyword;
    this.options = options;
  }

  async execute() {
    const packageJson = await generatePackageJson({
      keyword: this.keyword,
      registry: this.options.registry,
    });
    const tarballsSet = await crawler.getPackageJsonDependencies({
      packageJson,
      devDependencies: this.options.devDependencies,
      peerDependencies: this.options.peerDependencies,
      registry: this.options.registry,
    });
    return downloader.downloadFromIterable(tarballsSet, this.options.directory);
  }
}

module.exports = NpmDownloadSearchCommand;
