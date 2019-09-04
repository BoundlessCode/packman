import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageCommand from '../download/NpmDownloadPackageCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmCopyOptions, npmCopyOptions } from '../npm-options';

export type NpmCopyPackageCommandOptions =
  NpmCopyOptions
  & CommandExecuteOptions
  & {
    name: string
    version: string
  }

export default class NpmCopyPackageCommand implements Command {
  get definition() {
    return {
      name: 'package',
      flags: '<name> [version]',
      description: 'copy packages from one registry to another',
      options: [
        ...npmCopyOptions,
      ],
    };
  }

  async execute(options: NpmCopyPackageCommandOptions) {
    const { sourceRegistry, logger } = options;
    if (!sourceRegistry) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadPackageCommand();
    await downloadCommand.execute({ ...options, registry: sourceRegistry, directory });
    logger.info('finished downloading');

    const targetRegistry = options.targetRegistry || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${targetRegistry}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: targetRegistry, distTag: false });
    logger.info('finished copying');
  }
}
