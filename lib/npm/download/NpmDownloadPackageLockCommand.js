const Command = require('../../core/Command');
const { retrieveFile } = require('../../core/uri-retriever');
const downloader = require('./downloader');

class NpmDownloadPackageLockCommand extends Command {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = options;
  }

  async execute() {
    const packageLock = await retrieveFile(this.uri);
    return downloader.downloadFromPackageLock(packageLock, this.options.directory);
  }
}

module.exports = NpmDownloadPackageLockCommand;
