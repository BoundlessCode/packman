import Command from '../../../core/Command';
import { generateFileName } from '../../../core/generators';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageCommand from '../download/NpmDownloadPackageCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmCopyOptions, npmCopyOptions } from '../npm-options';

export type NpmCopyPackageCommandOptions =
  NpmCopyOptions
  & GlobalOptions
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
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCopyPackageCommandOptions) {
    const { source, logger } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || generateFileName(`copy-%DATE%`);
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadPackageCommand();
    await downloadCommand.execute({ ...options, registry: source, directory });
    logger.info('finished downloading');

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${target}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: target, distTag: false });
    logger.info('finished copying');
  }
}
