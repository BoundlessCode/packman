const Command = require('../../core/Command');
const { registryOption } = require('../../core/commandOptions');
const { publish } = require('./publisher');
const NpmPublisher = require('./NpmPublisher');

class NpmPublishTarballsCommand extends Command {
  get definition() {
    return {
      name: 'tarballs <packagesPath>',
      description: 'use npm to publish tarballs at the specified path to the registry',
      options: [
        registryOption,
      ],
      action: ((packagesPath, command) => this.execute({ packagesPath, ...command })),
    };
  }

  async execute(options = {}) {
    const { packagesPath, registry, distTag } = options;
    const publisher = new NpmPublisher({ packagesPath, registry, distTag });
    await publish(publisher);
  }
}

module.exports = NpmPublishTarballsCommand;
