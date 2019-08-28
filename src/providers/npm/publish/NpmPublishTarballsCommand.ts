import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, registryOption } from '../../../core/commandOptions';
import NpmPublisher from './NpmPublisher';

export type NpmPublishTarballsCommandOptions = CommandExecuteOptions & {
  packagesPath: string
  registry: string
  distTag: boolean
  lenientSsl?: boolean
}

export default class NpmPublishTarballsCommand implements Command {
  get definition() {
    return {
      name: 'tarballs',
      flags: '<packagesPath>',
      description: 'use npm to publish tarballs (.tgz files) at the specified path to the registry',
      options: [
        registryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmPublishTarballsCommandOptions) {
    const { packagesPath, registry, distTag, lenientSsl = false, logger } = options;
    const publisher = new NpmPublisher({ packagesPath, registry, distTag, lenientSsl, logger });
    await publisher.publish();
  }
}
