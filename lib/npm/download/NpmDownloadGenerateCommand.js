const Command = require('../../core/Command');
const { outputFileOption, dependenciesOptions } = require('../../core/commandOptions');
const crawler = require('./crawler');
const generator = require('./generator');

class NpmDownloadGenerateCommand extends Command {
  get definition() {
    return {
      name: 'generate <name> [version]',
      description: 'generates the download links for a given package and version',
      options: [
        outputFileOption,
        ...dependenciesOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { name, version, devDependencies, peerDependencies, outputFile } = options;
    const tarballsSet = await crawler.getDependencies({
      name,
      version,
      devDependencies,
      peerDependencies,
    });
    generator.saveToFile(Array.from(tarballsSet), outputFile);
  }
}

module.exports = NpmDownloadGenerateCommand;
