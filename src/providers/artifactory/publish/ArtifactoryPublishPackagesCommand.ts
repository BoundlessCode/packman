import Command from '../../../core/Command';
import ArtifactoryPublisher, { ArtifactoryPublisherOptions, artifactoryPublisherOptions } from './ArtifactoryPublisher';

export type ArtifactoryPublishPackagesCommandOptions =
  ArtifactoryPublisherOptions
  & {
    packagesPath: string
  }

export default class ArtifactoryPublishPackagesCommand implements Command {
  get definition() {
    return {
      name: 'packages',
      flags: '<packagesPath> <server> <repo> <packageType>',
      description: 'use the artifactory api to publish packages at the specified path to the registry',
      options: [
        ...artifactoryPublisherOptions,
      ],
    };
  }

  async execute(options: ArtifactoryPublishPackagesCommandOptions) {
    const publisher = new ArtifactoryPublisher(options);
    await publisher.publish();
  }
}
