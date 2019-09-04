import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, registryOption } from '../../../core/commandOptions';
import NpmPublisher from './NpmPublisher';
import { NpmRegistryOption } from '../npm-options';

export type NpmPublishTarballsCommandOptions =
  NpmRegistryOption
  & GlobalOptions
  & {
    packagesPath: string
    distTag: boolean
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
    const publisher = new NpmPublisher(options);
    await publisher.publish();
  }
}
