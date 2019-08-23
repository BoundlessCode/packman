const Command = require('../../../core/Command');
const { globalOptions, directoryOption } = require('../../../core/commandOptions');
const { fetchNexusCatalog } = require('../nexus-utils');

class NexusCatalogComponentsCommand extends Command {
  get definition() {
    return {
      name: 'components',
      flags: '<repository>',
      description: 'create a catalog of the packages in the specified nexus repository using the components API endpoint',
      options: [
        directoryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    await fetchNexusCatalog({ ...options, endpoint: 'components' });
  }
}

module.exports = NexusCatalogComponentsCommand;
