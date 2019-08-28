import { CommandExecuteOptions } from '../../../core/Command';

import dayjs from 'dayjs';

import Command from '../../../core/Command';
import { directoryOption, targetRegistryOption } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageLockCommand from '../download/NpmDownloadPackageLockCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopyPackageLockCommandOptions = CommandExecuteOptions & {
  uri: string
  direcory: string
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
        directoryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options: NpmCopyPackageLockCommandOptions) {
    const { uri, logger } = options;
    logger.info('copying packages');
    logger.info('uri', uri);
    logger.info('directory', options.direcory);
    logger.info('target', options.target);
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);
    const downloadCommand = new NpmDownloadPackageLockCommand();
    const downloads = await downloadCommand.execute({ uri, directory, logger });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ packagesPath: directory, registry: target, distTag: false, logger });
    logger.info('finished copying');
  }
}
