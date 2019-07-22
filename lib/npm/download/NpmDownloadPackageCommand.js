const Command = require('../../core/Command');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadPackageCommand extends Command {
  constructor(name, version, options = {}) {
    this.name = name;
    this.version = version;
    this.options = options;
  }
  
  async execute() {
    const tarballsSet = await crawler.getDependencies({
      name: this.name,
      version: this.version,
      devDependencies: this.options.devDependencies,
      peerDependencies: this.options.peerDependencies,
      registry: this.options.registry,
    });
    return downloader.downloadFromIterable(tarballsSet, this.options.directory);
  }
}

module.exports = NpmDownloadPackageCommand;
