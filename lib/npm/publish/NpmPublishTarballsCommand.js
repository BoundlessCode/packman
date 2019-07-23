const Command = require('../../core/Command');
const { registryOption } = require('../../core/commandOptions');
const { publish } = require('./publisher');
const NpmPublisher = require('./NpmPublisher');

class NpmPublishTarballsCommand extends Command {
  get definition() {
    return {
      name: 'tarballs <packagesPath>',
      description: 'use npm to publish tarballs (.tgz files) at the specified path to the registry',
      options: [
        registryOption,
      ],
    };
  }

  async execute(options = {}) {
    const { packagesPath, registry, distTag } = options;
    const publisher = new NpmPublisher({ packagesPath, registry, distTag });
    await publish(publisher);
  }
}

module.exports = NpmPublishTarballsCommand;
