import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { directoryOption, sourceRegistryOption, targetRegistryOption } from '../../../core/commandOptions';
import { dependenciesOptions } from '../npm-options';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageJsonCommand from '../download/NpmDownloadPackageJsonCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopyPackageJsonCommandOptions = CommandExecuteOptions & {
  direcory: string
  source: string
  target: string
  devDependencies: boolean
  peerDependencies: boolean
}

export default class NpmCopyPackageJsonCommand implements Command {
  get definition() {
    return {
      name: 'package-json',
      flag: '<uri>',
      description: 'copy packages specified in a package.json file to the target registry',
      options: [
        directoryOption,
        ...dependenciesOptions,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options: NpmCopyPackageJsonCommandOptions) {
    const { uri, logger } = options;
    logger.info('copying packages');
    logger.info('uri', uri);
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
    const downloadCommand = new NpmDownloadPackageJsonCommand();
    const downloads = await downloadCommand.execute({ uri, directory, registry: source, devDependencies, peerDependencies, logger });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ packagesPath: directory, registry: target, distTag: false, logger });
    logger.info('finished copying');
  }
}
