import dayjs from 'dayjs';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { directoryOption, sourceRegistryOption, targetRegistryOption } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageCommand from '../download/NpmDownloadPackageCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopyPackageCommandOptions = CommandExecuteOptions & {
  name: string
  version: string
  direcory: string
  source: string
  target: string
}

export default class NpmCopyPackageCommand implements Command {
  get definition() {
    return {
      name: 'package',
      flags: '<name> [version]',
      description: 'copy packages from one registry to another',
      options: [
        directoryOption,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options: NpmCopyPackageCommandOptions) {
    const { name, version, logger } = options;
    logger.info('copying package');
    logger.info('name', name);
    logger.info('version', version);
    logger.info('directory', options.direcory);
    logger.info('source', options.source);
    logger.info('target', options.target);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);
    const downloadCommand = new NpmDownloadPackageCommand();
    const downloads = await downloadCommand.execute({ name, version, registry: source, directory, logger });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ packagesPath: directory, registry: target, distTag: false, logger });
    logger.info('finished copying');
  }
}
