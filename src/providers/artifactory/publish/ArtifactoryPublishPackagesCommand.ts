import Command, { GlobalOptions } from '../../../core/Command';
import { globalOptions } from '../../../core/commandOptions';
import ArtifactoryPublisher from './ArtifactoryPublisher';

export type ArtifactoryPublishPackagesCommandOptions = GlobalOptions & {
  packagesPath: string
  server: string
  repo: string
  packageType: string
}

export default class ArtifactoryPublishPackagesCommand implements Command {
  get definition() {
    return {
      name: 'packages',
      flags: '<packagesPath> <server> <repo> <packageType>',
      description: 'use the artifactory api to publish packages at the specified path to the registry',
      options: [
        // registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryPublishPackagesCommandOptions) {
    const publisher = new ArtifactoryPublisher(options);
    await publisher.publish();
  }
}
