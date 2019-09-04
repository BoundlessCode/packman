import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { NpmCopyOptions, npmCopyOptions, DependenciesOptions, dependenciesOptions } from '../npm-options';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadSearchCommand from '../download/NpmDownloadSearchCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopySearchCommandOptions =
  NpmCopyOptions
  & DependenciesOptions
  & CommandExecuteOptions
  & {
    keyword: string
  }

export default class NpmCopySearchCommand implements Command {
  get definition() {
    return {
      name: 'search',
      flags: '<keyword>',
      description: 'copy packages returned by an npm registry search to the target registry',
      options: [
        ...npmCopyOptions,
        ...dependenciesOptions,
      ],
    };
  }

  async execute(options: NpmCopySearchCommandOptions) {
    const { sourceRegistry, logger } = options;
    if (!sourceRegistry) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadSearchCommand();
    await downloadCommand.execute({ ...options, directory, registry: sourceRegistry });
    logger.info('finished downloading');

    const targetRegistry = options.targetRegistry || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${targetRegistry}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: targetRegistry, distTag: false });
    logger.info('finished copying');
  }
}
