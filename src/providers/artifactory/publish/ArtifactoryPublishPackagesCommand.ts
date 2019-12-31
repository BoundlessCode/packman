import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { publisherOptions, PublisherOptions } from '../../../core/Publisher';
import ArtifactoryPublisher from './ArtifactoryPublisher';

export type ArtifactoryPublishPackagesCommandOptions =
  GlobalOptions
  & PublisherOptions
  & {
    packagesPath: string
    server: string
    repo: string
    packageType: string
    apiKey?: string
    byChecksum?: boolean
    force?: boolean
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
        {
          flags: '--force',
          description: 'publish packages even if they have already been published'
        },
        ...publisherOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryPublishPackagesCommandOptions) {
    const publisher = new ArtifactoryPublisher(options);
    await publisher.publish();
  }
}
