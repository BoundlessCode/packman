const Command = require('../../../core/Command');
const { globalOptions, registryOption, directoryOption, forceOption } = require('../../../core/commandOptions');
const { retrieveFile } = require('../../../core/uri-retriever');
const { getCurrentRegistry, getAllEndpointUrl } = require('../npm-utils');
const crawler = require('../crawler');
const downloader = require('./downloader');

class NpmDownloadAllCommand extends Command {
  get definition() {
    return {
      name: 'all',
      description: 'download tarballs for all packages hosted by the registry',
      options: [
        registryOption,
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { force, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const url = getAllEndpointUrl(registry, { logger });
    const searchResults = await retrieveFile(url, { json: true, logger });
    const packages = await crawler.getDependenciesFromSearchResults(searchResults, { ...options, registry });
    return downloader.downloadFromIterable(packages, options.directory, { force, logger });
  }
}

module.exports = NpmDownloadAllCommand;
