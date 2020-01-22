import Command from '../../../core/Command';
import NugetPublisher, { NugetPublisherOptions, nugetPublisherOptions } from './NugetPublisher';

export type NugetPublishNupkgsCommandOptions =
  NugetPublisherOptions
  & {
    packagesPath: string
  }

export default class NugetPublishNupkgsCommand implements Command {
  get definition() {
    return {
      name: 'nupkgs',
      flags: '<packagesPath> <registry>',
      description: 'use dotnet nuget to publish nupkgs (.nupkg files) at the specified path to the registry',
      options: [
        ...nugetPublisherOptions,
      ],
    };
  }

  async execute(options: NugetPublishNupkgsCommandOptions) {
    const publisher = new NugetPublisher(options);
    await publisher.publish();
  }
}
