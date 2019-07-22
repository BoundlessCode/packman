const Command = require('../../core/Command');
const crawler = require('./crawler');
const generator = require('./generator');

class NpmDownloadGenerateCommand extends Command {
  constructor(name, version, options) {
    this.name = name;
    this.version = version;
    this.options = options;
  }

  async execute() {
    const tarballsSet = await crawler.getDependencies({
      name: this.name,
      version: this.version,
      devDependencies: this.options.devDependencies,
      peerDependencies: this.options.peerDependencies
    });
    generator.saveToFile(Array.from(tarballsSet), this.options.outputFile);
  }
}

module.exports = NpmDownloadGenerateCommand;
