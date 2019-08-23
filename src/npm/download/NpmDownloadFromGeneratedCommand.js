const Command = require('../../core/Command');
const { globalOptions, directoryOption, forceOption } = require('../../core/commandOptions');
const downloader = require('./downloader');
const generator = require('./generator');

class NpmDownloadFromGeneratedCommand extends Command {
  get definition() {
    return {
      name: 'from-generated',
      flags: '<uri>',
      description: 'download tarballs using a file created by the generate command',
      options: [
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { uri, force, logger } = options;
    const tarball = await generator.readFromFile(uri, { logger });
    return downloader.downloadFromIterable(tarball, options.directory, { force, logger });
  }
}

module.exports = NpmDownloadFromGeneratedCommand;
