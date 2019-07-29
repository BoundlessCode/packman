const Command = require('../../core/Command');
const { globalOptions, outputFileOption, dependenciesOptions } = require('../../core/commandOptions');
const crawler = require('./crawler');
const generator = require('./generator');

class NpmDownloadGenerateCommand extends Command {
  get definition() {
    return {
      name: 'generate',
      flags: '<name> [version]',
      description: 'generates the download links for a given package and version',
      options: [
        outputFileOption,
        ...dependenciesOptions,
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
      outputFile,
      logger,
    } = options;
    
    const tarballsSet = await crawler.getDependencies({
      name,
      version,
      devDependencies,
      peerDependencies,
      logger,
    });
    generator.saveToFile(Array.from(tarballsSet), outputFile);
  }
}

module.exports = NpmDownloadGenerateCommand;
