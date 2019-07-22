const Command = require('../../core/Command');
const { directoryOption } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const downloader = require('./downloader');

class NpmDownloadPackageLockCommand extends Command {
  get definition() {
    return {
      name: 'package-lock <uri>',
      description: 'download tarballs based on a package-lock.json',
      options: [
        directoryOption,
      ],
      action: (uri, command) => this.execute({ uri, ...command }),
    };
  }

  async execute(options = {}) {
    const { uri, directory } = options;
    const packageLock = await retrieveFile(uri);
    return downloader.downloadFromPackageLock(packageLock, directory);
  }
}

module.exports = NpmDownloadPackageLockCommand;
