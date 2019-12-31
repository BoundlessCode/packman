import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, registryOption } from '../../../core/commandOptions';
import { PublisherOptions, publisherOptions } from '../../../core/Publisher';
import PypiPublisher from './PypiPublisher';
import { PypiRegistryOption } from '../pypi-options';

export type PypiPublishWheelsCommandOptions =
  PypiRegistryOption
  & PublisherOptions
  & GlobalOptions
  & {
    packagesPath: string
    distTag: boolean
  }

export default class PypiPublishWheelsCommand implements Command {
  get definition() {
    return {
      name: 'wheels',
      flags: '<packagesPath>',
      description: 'use twine to publish wheels (.whl files) at the specified path to the registry',
      options: [
        registryOption,
        ...publisherOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: PypiPublishWheelsCommandOptions) {
    const publisher = new PypiPublisher(options);
    await publisher.publish();
  }
}
