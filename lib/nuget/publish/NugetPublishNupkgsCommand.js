const Command = require('../../core/Command');
const { globalOptions, registryOption } = require('../../core/commandOptions');
const NugetPublisher = require('./NugetPublisher');

class NugetPublishNupkgsCommand extends Command {
  get definition() {
    return {
      name: 'nupkgs',
      flags: '<packagesPath>',
      description: 'use dotnet nuget to publish nupkgs (.nupkg files) at the specified path to the registry',
      options: [
        registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { packagesPath, registry, logger } = options;
    const publisher = new NugetPublisher({ packagesPath, registry, logger });
    await publisher.publish();
  }
}

module.exports = NugetPublishNupkgsCommand
