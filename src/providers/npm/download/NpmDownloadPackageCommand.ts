import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions, registryOption, forceOption } from '../../../core/commandOptions';
import { getDependencies, DependenciesOptions } from '../crawler';
import { downloadFromIterable } from './downloader';
import BundleZipCreateCommand from '../../bundle/zip/BundleZipCreateCommand';

export type NpmDownloadPackageCommandOptions = CommandExecuteOptions & DependenciesOptions & {
  name: string
  version?: string
  registry?: string
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
        registryOption,
        '--bundle [bundleName]',
        forceOption,
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadPackageCommandOptions): Promise<any> {
    const {
      name,
      version,
      devDependencies,
      peerDependencies,
      registry,
      directory,
      force = false,
      bundleName,
      logger,
    } = options;

    const tarballsSet = await getDependencies({
      name,
      version,
      devDependencies,
      peerDependencies,
      registry,
      logger,
    });

    const result = await downloadFromIterable(tarballsSet, directory, { force, logger });

    if(bundleName) {
      const bundleCommand = new BundleZipCreateCommand();
      await bundleCommand.execute({ directory, bundleName, logger })
    }
    return result;
  }
}
