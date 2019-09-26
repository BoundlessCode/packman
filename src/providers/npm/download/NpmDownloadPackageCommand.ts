import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, BundleNameOption, bundleOption } from '../../../core/commandOptions';
import BundleZipCreateCommand from '../../bundle/zip/BundleZipCreateCommand';
import { NpmDownloadOptions, npmDownloadOptions, DependenciesOptions, dependenciesOptions } from '../npm-options';
import { getDependencies } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadPackageCommandOptions =
  NpmDownloadOptions
  & BundleNameOption
  & GlobalOptions
  & DependenciesOptions
  & {
    name: string
    version?: string
    bundleName?: string
  }

export default class NpmDownloadPackageCommand implements Command {
  get definition() {
    return {
      name: 'package',
      flags: '<name> [version]',
      description: 'download tarballs based on a package and a version',
      options: [
        ...npmDownloadOptions,
        bundleOption,
        ...dependenciesOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadPackageCommandOptions): Promise<any> {
    const tarballsSet = await getDependencies(options);
    const result = await downloadFromIterable(tarballsSet, options.directory, options);

    if (options.bundleName) {
      const bundleCommand = new BundleZipCreateCommand();
      await bundleCommand.execute(options)
    }
    return result;
  }
}
