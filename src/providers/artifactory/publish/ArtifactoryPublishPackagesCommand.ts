import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions } from '../../../core/commandOptions';
import ArtifactoryPublisher from './ArtifactoryPublisher';

export type ArtifactoryPublishPackagesCommandOptions = CommandExecuteOptions & {
  packagesPath: string
  server: string
  repo: string
  packageType: string
  lenientSsl?: boolean
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
    const { packagesPath, server, repo, packageType, lenientSsl = false, logger } = options;
    const publisher = new ArtifactoryPublisher({ packagesPath, server, repo, packageType, lenientSsl, logger });
    await publisher.publish();
  }
}
