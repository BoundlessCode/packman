const Command = require('../../core/Command');
const { directoryOption } = require('../../core/commandOptions');
const downloader = require('./downloader');
const generator = require('./generator');

class NpmDownloadFromGeneratedCommand extends Command {
  get definition() {
    return {
      name: 'from-generated <uri>',
      description: 'download tarballs using a file created by the generate command',
      options: [
        directoryOption,
      ],
    };
  }

  async execute(options = {}) {
    const { uri, logger } = options;
    const tarball = await generator.readFromFile(uri, { logger });
    return downloader.downloadFromIterable(tarball, options.directory, logger);
  }
}

module.exports = NpmDownloadFromGeneratedCommand;
