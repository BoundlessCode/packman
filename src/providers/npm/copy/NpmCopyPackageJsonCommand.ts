import dayjs from 'dayjs';

import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { NpmCopyOptions, npmCopyOptions, DependenciesOptions, dependenciesOptions } from '../npm-options';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageJsonCommand from '../download/NpmDownloadPackageJsonCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopyPackageJsonCommandOptions =
  NpmCopyOptions
  & DependenciesOptions
  & GlobalOptions
  & {
    uri: string
  }

export default class NpmCopyPackageJsonCommand implements Command {
  get definition() {
    return {
      name: 'package-json',
      flag: '<uri>',
      description: 'copy packages specified in a package.json file to the target registry',
      options: [
        ...npmCopyOptions,
        ...dependenciesOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCopyPackageJsonCommandOptions) {
    const { sourceRegistry, logger } = options;
    if (!sourceRegistry) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadPackageJsonCommand();
    await downloadCommand.execute({ ...options, directory, registry: sourceRegistry });
    logger.info('finished downloading');

    const targetRegistry = options.targetRegistry || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${targetRegistry}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: targetRegistry, distTag: false });
    logger.info('finished copying');
  }
}
