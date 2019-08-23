const Command = require('../../../core/Command');
const { globalOptions, directoryOption } = require('../../../core/commandOptions');
const { fetchNexusCatalog } = require('../nexus-utils');

class NexusCatalogSearchCommand extends Command {
  get definition() {
    return {
      name: 'search',
      flags: '<repository>',
      description: 'create a catalog of the packages in the specified nexus repository using the search API endpoint',
      options: [
        directoryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    await fetchNexusCatalog({ ...options, endpoint: 'search' });
  }
}

module.exports = NexusCatalogSearchCommand;
