import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions } from '../../../core/commandOptions';
import BundleZipCreateCommand from '../../bundle/zip/BundleZipCreateCommand';
import { npmDownloadOptions, NpmDownloadOptions } from '../npm-options';
import { getDependencies, DependenciesOptions } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadPackageCommandOptions =
  NpmDownloadOptions
  & CommandExecuteOptions
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
        '--bundle [bundleName]',
        ...commonPackageOptions,
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
