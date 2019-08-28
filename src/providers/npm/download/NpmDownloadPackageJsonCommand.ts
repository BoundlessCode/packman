import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions, forceOption } from '../../../core/commandOptions';
import { retrieveFile } from '../../../core/uri-retriever';
import { getPackageJsonDependencies } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadPackageJsonCommandOptions = CommandExecuteOptions & {
  registry?: string
  directory: string
  devDependencies?: boolean
  peerDependencies?: boolean
  uri: string
  force?: boolean
}

export default class NpmDownloadPackageJsonCommand implements Command {
  get definition() {
    return {
      name: 'package-json',
      flags: '<uri>',
      description: 'download tarballs based on a package.json',
      options: [
        forceOption,
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadPackageJsonCommandOptions) {
    const { uri, force = false, logger } = options;
    const packageJson = await retrieveFile(uri, { logger });
    const tarballsSet = await getPackageJsonDependencies({
      packageJson,
      devDependencies: options.devDependencies,
      peerDependencies: options.peerDependencies,
      registry: options.registry,
      logger,
    });
    return downloadFromIterable(tarballsSet, options.directory, { force, logger });
  }
}
