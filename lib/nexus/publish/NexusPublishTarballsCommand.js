const Command = require('../../core/Command');
const { registryOption } = require('../../core/commandOptions');
const { publish } = require('../../npm/publish/publisher');
const NexusApiPublisher = require('./NexusApiPublisher');

class NexusPublishTarballsCommand extends Command {
  get definition() {
    return {
      name: 'tarballs <packagesPath>',
      description: 'use the nexus api to publish tarballs at the specified path to the registry',
      options: [
        registryOption,
      ],
      action: ((packagesPath, command) => this.execute({ packagesPath, ...command })),
    };
  }

  async execute(options = {}) {
    const { packagesPath, registry, distTag } = options;
    const publisher = new NexusApiPublisher({ packagesPath, registry, distTag });
    await publish(publisher);
  }
}

module.exports = NexusPublishTarballsCommand;
