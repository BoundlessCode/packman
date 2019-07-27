const Command = require('../../core/Command');
const { globalOptions, registryOption } = require('../../core/commandOptions');
const NexusApiPublisher = require('./NexusApiPublisher');

class NexusPublishTarballsCommand extends Command {
  get definition() {
    return {
      name: 'tarballs <packagesPath>',
      description: 'use the nexus api to publish tarballs at the specified path to the registry',
      options: [
        registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { packagesPath, registry, distTag } = options;
    const publisher = new NexusApiPublisher({ packagesPath, registry, distTag });
    publisher.publish();
  }
}

module.exports = NexusPublishTarballsCommand;
