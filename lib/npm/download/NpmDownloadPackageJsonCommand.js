const Command = require('../../core/Command');
const { retrieveFile } = require('../../core/uri-retriever');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadPackageJsonCommand extends Command {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = options;
  }
  
  async execute() {
    const packageJson = await retrieveFile(this.uri);
    const tarballsSet = await crawler.getPackageJsonDependencies({
      packageJson,
      devDependencies: this.options.devDependencies,
      peerDependencies: this.options.peerDependencies,
      registry: this.options.registry,
    });
    return downloader.downloadFromIterable(tarballsSet, this.options.directory);
  }
}

module.exports = NpmDownloadPackageJsonCommand;
