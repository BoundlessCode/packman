const Command = require('../../core/Command');
const { options } = require('../../core/initializer');
const downloader = require('./downloader');
const generator = require('./generator');

class NpmDownloadFromGeneratedCommand extends Command {
  get definition() {
    return {
      name: 'from-generated <uri>',
      description: 'download tarballs using a file created by the generate command',
      options: [
        options.directoryOption,
      ],
      action: (uri, command) => this.execute({ uri, ...command }),
    };
  }

  async execute(options = {}) {
    const { uri } = options;
    const tarball = await generator.readFromFile(uri);
    return downloader.downloadFromIterable(tarball, options.directory);
  }
}

module.exports = NpmDownloadFromGeneratedCommand;
