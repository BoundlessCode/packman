import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, registryOption } from '../../../core/commandOptions';
import NugetPublisher from './NugetPublisher';

export type NugetPublishNupkgsCommandOptions =
  GlobalOptions
  & {
    registry: string
    packagesPath: string
  }

export default class NugetPublishNupkgsCommand implements Command {
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

  async execute(options: NugetPublishNupkgsCommandOptions) {
    const { packagesPath, registry, logger } = options;
    const publisher = new NugetPublisher({ packagesPath, registry, logger });
    await publisher.publish();
  }
}
