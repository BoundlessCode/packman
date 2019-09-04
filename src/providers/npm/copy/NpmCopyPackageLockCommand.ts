import dayjs from 'dayjs';

import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, directoryOption } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageLockCommand from '../download/NpmDownloadPackageLockCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmDirectoryOption, NpmTargetRegistryOption, targetRegistryOption } from '../npm-options';

export type NpmCopyPackageLockCommandOptions =
  NpmDirectoryOption
  & NpmTargetRegistryOption
  & GlobalOptions
  & {
    uri: string
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
        ...globalOptions,
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

    const targetRegistry = options.targetRegistry || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${targetRegistry}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: targetRegistry, distTag: false });
    logger.info('finished copying');
  }
}
