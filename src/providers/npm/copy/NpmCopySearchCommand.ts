import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { directoryOption, sourceRegistryOption, targetRegistryOption, dependenciesOptions } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadSearchCommand from '../download/NpmDownloadSearchCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopySearchCommandOptions = CommandExecuteOptions & {
  keyword: string
  direcory: string
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
    const { keyword, logger } = options;
    logger.info('copying packages');
    logger.info('keyword', keyword);
    logger.info('directory', options.direcory);
    logger.info('source', options.source);
    logger.info('target', options.target);
    logger.info('devDependencies', options.devDependencies);
    logger.info('peerDependencies', options.peerDependencies);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);
    const { devDependencies, peerDependencies } = options;
    const downloadCommand = new NpmDownloadSearchCommand();
    const downloads = await downloadCommand.execute({ keyword, directory, registry: source, devDependencies, peerDependencies, logger });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ packagesPath: directory, registry: target, distTag: false, logger });
    logger.info('finished copying');
  }
}
