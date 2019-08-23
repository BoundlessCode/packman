const Command = require('../../../core/Command');
const { globalOptions, registryOption } = require('../../../core/commandOptions');
const NpmPublisher = require('./NpmPublisher');

class NpmPublishTarballsCommand extends Command {
  get definition() {
    return {
      name: 'tarballs',
      flags: '<packagesPath>',
      description: 'use npm to publish tarballs (.tgz files) at the specified path to the registry',
      options: [
        registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { packagesPath, registry, distTag, lenientSsl, logger } = options;
    const publisher = new NpmPublisher({ packagesPath, registry, distTag, lenientSsl, logger });
    await publisher.publish();
  }
}

module.exports = NpmPublishTarballsCommand;
