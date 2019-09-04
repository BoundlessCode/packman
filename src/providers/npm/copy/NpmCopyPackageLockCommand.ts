import { CommandExecuteOptions } from '../../../core/Command';

import dayjs from 'dayjs';

import Command from '../../../core/Command';
import { targetRegistryOption } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageLockCommand from '../download/NpmDownloadPackageLockCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmCopyOptions, npmCopyOptions } from '../npm-options';

export type NpmCopyPackageLockCommandOptions =
  NpmCopyOptions
  & CommandExecuteOptions
  & {
    uri: string
    target: string
    force?: boolean
  }

export default class NpmCopyPackageLockCommand implements Command {
  get definition() {
    return {
      name: 'package-lock',
      flags: '<uri>',
      description: 'copy packages specified in a package-lock.json file to the target registry',
      options: [
        ...npmCopyOptions,
        targetRegistryOption,
      ],
    };
  }

  async execute(options: NpmCopyPackageLockCommandOptions) {
    const { logger } = options;

    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadPackageLockCommand();
    await downloadCommand.execute({ ...options, directory });
    logger.info('finished downloading');

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${target}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: target, distTag: false });
    logger.info('finished copying');
  }
}
