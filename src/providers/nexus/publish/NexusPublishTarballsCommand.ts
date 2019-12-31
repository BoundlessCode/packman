import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, registryOption } from '../../../core/commandOptions';
import { PublisherOptions, publisherOptions } from '../../../core/Publisher';
import { LoggerOptions } from '../../../core/logger';
import NexusPublisher from './NexusPublisher';

export type NexusPublishTarballsCommandOptions =
  GlobalOptions
  & PublisherOptions
  & LoggerOptions
  & {
    packagesPath: string
    registry: string
    distTag: boolean
  }

export default class NexusPublishTarballsCommand implements Command {
  get definition() {
    return {
      name: 'tarballs',
      flags: '<packagesPath>',
      description: 'use the nexus api to publish tarballs at the specified path to the registry',
      options: [
        registryOption,
        ...publisherOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NexusPublishTarballsCommandOptions) {
    const publisher = new NexusPublisher(options);
    publisher.publish();
  }
}
