const Command = require('../../core/Command');
const { options } = require('../../core/initializer');
const { publish } = require('../../npm/publish/publisher');

class NexusPublishTarballsCommand extends Command {
  get definition() {
    return {
      name: 'tarballs <packagesPath>',
      description: 'use the nexus api to publish tarballs at the specified path to the registry',
      options: [
        options.registryOption,
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
