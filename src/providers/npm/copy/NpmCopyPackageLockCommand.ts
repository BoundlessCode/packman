import Command from '../../../core/Command';
import { generateFileName } from '../../../core/generators';
import { GlobalOptions, globalOptions, DirectoryOption, directoryOption } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageLockCommand from '../download/NpmDownloadPackageLockCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmTargetRegistryOption, targetRegistryOption } from '../npm-options';

export type NpmCopyPackageLockCommandOptions =
  DirectoryOption
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

    const directory = options.directory || generateFileName(`copy-%DATE%`);
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
