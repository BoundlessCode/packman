import Command from '../../../core/Command';
import { generateFileName } from '../../../core/generators';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { NpmCopyOptions, npmCopyOptions, DependenciesOptions, dependenciesOptions } from '../npm-options';
import { getCurrentRegistry } from '../npm-utils';
import NpmDownloadPackageJsonCommand from '../download/NpmDownloadPackageJsonCommand';
import NpmPublishTarballsCommand from '../publish/NpmPublishTarballsCommand';

export type NpmCopyPackageJsonCommandOptions =
  NpmCopyOptions
  & DependenciesOptions
  & GlobalOptions
  & {
    uri: string
  }

export default class NpmCopyPackageJsonCommand implements Command {
  get definition() {
    return {
      name: 'package-json',
      flag: '<uri>',
      description: 'copy packages specified in a package.json file to the target registry',
      options: [
        ...npmCopyOptions,
        ...dependenciesOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCopyPackageJsonCommandOptions) {
    const { source, logger } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }

    const directory = options.directory || generateFileName(`copy-%DATE%`);
    logger.info(`using the directory ${directory}`);

    const downloadCommand = new NpmDownloadPackageJsonCommand();
    await downloadCommand.execute({ ...options, directory, registry: source });
    logger.info('finished downloading');

    const target = options.target || await getCurrentRegistry(options);
    logger.info(`publishing to the registry ${target}`);

    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ ...options, packagesPath: directory, registry: target, distTag: false });
    logger.info('finished copying');
  }
}
