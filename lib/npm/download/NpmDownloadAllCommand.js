const Command = require('../../core/Command');
const { retrieveFile } = require('../../core/uri-retriever');
const { getCurrentRegistry } = require('../npm-utils');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadAllCommand extends Command {
  constructor(options = {}) {
    this.options = options;
  }

  async execute() {
    const registry = this.options.registry || await getCurrentRegistry();
    const url = new URL('/-/all', registry);
    const searchResults = await retrieveFile(url, { json: true });
    const packages = await crawler.getDependenciesFromSearchResults(searchResults, { ...this.options, registry });
    return downloader.downloadFromIterable(packages, this.options.directory);
  }
}

module.exports = NpmDownloadAllCommand;
