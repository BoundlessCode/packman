import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import { getPackageJsonDependencies } from '../crawler';
import NpmPackageManifest from '../NpmPackageManifest';
import { npmDownloadOptions, NpmDownloadOptions, DependenciesOptions } from '../npm-options';
import { downloadFromIterable } from './downloader';

export type NpmDownloadPackageJsonCommandOptions =
  NpmDownloadOptions
  & CommandExecuteOptions
  & DependenciesOptions
  & {
    uri: string
  }

export default class NpmDownloadPackageJsonCommand implements Command {
  get definition() {
    return {
      name: 'package-json',
      flags: '<uri>',
      description: 'download tarballs based on a package.json',
      options: [
        ...npmDownloadOptions,
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
