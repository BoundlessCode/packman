const Command = require('../../core/Command');
const downloader = require('./downloader');
const generator = require('./generator');

class NpmDownloadFromGeneratedCommand extends Command {
  constructor(uri, options) {
    this.uri = uri;
    this.options = options;
  }
  
  async execute() {
    const tarball = await generator.readFromFile(this.uri);
    return downloader.downloadFromIterable(tarball, this.options.directory);
  }
}

exports.NpmDownloadFromGeneratedCommand = NpmDownloadFromGeneratedCommand;
