import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions, forceOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import { getPackageJsonDependencies, DependenciesOptions } from '../crawler';
import NpmPackageManifest from '../NpmPackageManifest';
import { npmDownloadOptions, NpmDownloadCommandOptions } from '../npm-options';
import { downloadFromIterable } from './downloader';

export type NpmDownloadPackageJsonCommandOptions =
  NpmDownloadCommandOptions
  & CommandExecuteOptions
  & DependenciesOptions
  & {
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
        ...npmDownloadOptions,
        forceOption,
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadPackageJsonCommandOptions) {
    const { body: packageJson } = await fetch<NpmPackageManifest>(options);
    const tarballsSet = await getPackageJsonDependencies({ ...options, packageJson });
    return downloadFromIterable(tarballsSet, options.directory, options);
  }
}
