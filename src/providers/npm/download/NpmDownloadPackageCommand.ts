import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions, forceOption } from '../../../core/commandOptions';
import BundleZipCreateCommand from '../../bundle/zip/BundleZipCreateCommand';
import { npmDownloadOptions, NpmDownloadCommandOptions } from '../npm-options';
import { getDependencies, DependenciesOptions } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadPackageCommandOptions =
  NpmDownloadCommandOptions
  & CommandExecuteOptions
  & DependenciesOptions
  & {
    name: string
    version?: string
    directory: string
    force?: boolean
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
        forceOption,
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
