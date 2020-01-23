import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { Fetcher } from '../../../core/fetcher';
import { getPackageJsonDependencies } from '../crawler';
import NpmPackageManifest from '../NpmPackageManifest';
import { NpmDownloadOptions, npmDownloadOptions, DependenciesOptions, dependenciesOptions } from '../npm-options';
import { downloadFromIterable } from './downloader';

export type NpmDownloadPackageJsonCommandOptions =
  NpmDownloadOptions
  & GlobalOptions
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
        ...dependenciesOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadPackageJsonCommandOptions) {
    const fetcher = new Fetcher({
      lenientSsl: options.lenientSsl,
    });
    const { body: packageJson } = await fetcher.fetch<NpmPackageManifest>(options);
    const tarballsSet = await getPackageJsonDependencies({ ...options, packageJson });
    return downloadFromIterable(tarballsSet, options.directory, options);
  }
}
