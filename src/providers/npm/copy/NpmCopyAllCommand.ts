import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadAllCommand from '../download/NpmDownloadAllCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmCopyOptions, npmCopyOptions } from '../npm-options';

export type NpmCopyAllCommandOptions =
  NpmCopyOptions
  & CommandExecuteOptions & {
  }

export default class NpmCopyAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      description: 'copy packages returned by the /-/all endpoint to the target registry',
      options: [
        ...npmCopyOptions,
      ],
    };
  }

  async execute(options: NpmCopyAllCommandOptions) {
    const { sourceRegistry, logger } = options;
    if (!sourceRegistry) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadAllCommand();
    await downloadCommand.execute({ ...options, directory, registry: sourceRegistry });
    logger.info('finished downloading');

    const targetRegistry = options.targetRegistry || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${targetRegistry}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: targetRegistry, distTag: false });
    logger.info('finished copying');
  }
}
