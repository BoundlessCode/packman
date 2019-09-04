import Command, { GlobalOptions } from '../../../core/Command';
import { globalOptions, registryOption } from '../../../core/commandOptions';
import { LoggerOptions } from '../../../core/logger';
import NexusPublisher from './NexusPublisher';

export type NexusPublishTarballsCommandOptions = GlobalOptions & LoggerOptions & {
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
        ...globalOptions,
      ],
    };
  }

  async execute(options: NexusPublishTarballsCommandOptions) {
    const publisher = new NexusPublisher(options);
    publisher.publish();
  }
}
