const Command = require('../../core/Command');
const { globalOptions, directoryOption } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const downloader = require('./downloader');

class NpmDownloadPackageLockCommand extends Command {
  get definition() {
    return {
      name: 'package-lock <uri>',
      description: 'download tarballs based on a package-lock.json',
      options: [
        directoryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { uri, directory, logger } = options;
    const packageLock = await retrieveFile(uri, { logger });
    return downloader.downloadFromPackageLock(packageLock, directory, logger);
  }
}

module.exports = NpmDownloadPackageLockCommand;
