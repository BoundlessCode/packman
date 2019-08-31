import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions, forceOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import { getPackageJsonDependencies, DependenciesOptions } from '../crawler';
import { downloadFromIterable } from './downloader';
import NpmPackageManifest from '../NpmPackageManifest';

export type NpmDownloadPackageJsonCommandOptions = CommandExecuteOptions & DependenciesOptions & {
  registry?: string
  directory: string
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
    const {
      uri,
      force = false,
      logger,
      dependencies,
      devDependencies,
      peerDependencies,
      registry,
      directory,
    } = options;
    const packageJson = await fetch<NpmPackageManifest>({ uri, logger });
    const tarballsSet = await getPackageJsonDependencies({
      packageJson,
      dependencies,
      devDependencies,
      peerDependencies,
      registry,
      logger,
    });
    return downloadFromIterable(tarballsSet, directory, { force, logger });
  }
}
