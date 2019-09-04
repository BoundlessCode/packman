import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { directoryOption, sourceRegistryOption, targetRegistryOption } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadAllCommand from '../download/NpmDownloadAllCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmDirectoryOption } from '../npm-options';

export type NpmCopyAllCommandOptions =
  NpmDirectoryOption
  & CommandExecuteOptions & {
  }

export default class NpmCopyAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      description: 'copy packages returned by the /-/all endpoint to the target registry',
      options: [
        directoryOption,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options: NpmCopyAllCommandOptions) {
    const { source, logger } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadAllCommand();
    await downloadCommand.execute({ ...options, directory, registry: source });
    logger.info('finished downloading');

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${target}`);
    
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: target, distTag: false });
    logger.info('finished copying');
  }
}
