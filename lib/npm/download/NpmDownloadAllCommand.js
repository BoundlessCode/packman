const Command = require('../../core/Command');
const { registryOption, directoryOption } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const { getCurrentRegistry } = require('../npm-utils');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadAllCommand extends Command {
  get definition() {
    return {
      name: 'all',
      description: 'download tarballs for all packages hosted by the registry',
      options: [
        registryOption,
        directoryOption,
      ],
    };
  }

  async execute(options = {}) {
    const { logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const url = new URL('/-/all', registry);
    const searchResults = await retrieveFile(url, { json: true, logger });
    const packages = await crawler.getDependenciesFromSearchResults(searchResults, { ...options, registry });
    return downloader.downloadFromIterable(packages, options.directory, logger);
  }
}

module.exports = NpmDownloadAllCommand;
