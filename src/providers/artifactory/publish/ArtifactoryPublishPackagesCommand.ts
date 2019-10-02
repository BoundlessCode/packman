import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import ArtifactoryPublisher from './ArtifactoryPublisher';

export type ArtifactoryPublishPackagesCommandOptions =
  GlobalOptions
  & {
    packagesPath: string
    server: string
    repo: string
    packageType: string
    apiKey?: string
    byChecksum?: boolean
  }

export default class ArtifactoryPublishPackagesCommand implements Command {
  get definition() {
    return {
      name: 'packages',
      flags: '<packagesPath> <server> <repo> <packageType>',
      description: 'use the artifactory api to publish packages at the specified path to the registry',
      options: [
        // registryOption,
        {
          flags: '--api-key <apiKey>',
          description: 'your API Key, as specified on your user profile page in Artifactory',
        },
        {
          flags: '--by-checksum',
          description: 'calculate the sha256, sha1, and md5 checksums and use them to deploy to Artifactory'
        },
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryPublishPackagesCommandOptions) {
    const publisher = new ArtifactoryPublisher(options);
    await publisher.publish();
  }
}
