import Command from '../../../core/Command';
import { generateFileName } from '../../../core/generators';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadAllCommand from '../download/NpmDownloadAllCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';
import { NpmCopyOptions, npmCopyOptions } from '../npm-options';

export type NpmCopyAllCommandOptions =
  NpmCopyOptions
  & GlobalOptions
  & {
  }

export default class NpmCopyAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      description: 'copy packages returned by the /-/all endpoint to the target registry',
      options: [
        ...npmCopyOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCopyAllCommandOptions) {
    const { source, logger } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || generateFileName(`copy-%DATE%`);
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadAllCommand();
    await downloadCommand.execute({ ...options, directory, registry: source });
    logger.info('finished downloading');

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${target}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: target, distTag: false });
    logger.info('finished copying');
  }
}
