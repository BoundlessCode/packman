import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { directoryOption, sourceRegistryOption, targetRegistryOption } from '../../../core/commandOptions';
import { dependenciesOptions, NpmDirectoryOption } from '../npm-options';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadSearchCommand from '../download/NpmDownloadSearchCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopySearchCommandOptions =
  NpmDirectoryOption
  & CommandExecuteOptions
  & {
    keyword: string
    source: string
    target: string
    devDependencies: boolean
    peerDependencies: boolean
  }

export default class NpmCopySearchCommand implements Command {
  get definition() {
    return {
      name: 'search',
      flags: '<keyword>',
      description: 'copy packages returned by an npm registry search to the target registry',
      options: [
        directoryOption,
        ...dependenciesOptions,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options: NpmCopySearchCommandOptions) {
    const { source, logger } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadSearchCommand();
    await downloadCommand.execute({ ...options, directory, registry: source });
    logger.info('finished downloading');

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${target}`);
    
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: target, distTag: false });
    logger.info('finished copying');
  }
}
