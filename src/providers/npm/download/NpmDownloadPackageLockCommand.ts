import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, directoryOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import { downloadFromPackageLock } from './downloader';
import NpmPackageManifest from '../NpmPackageManifest';

export type NpmDownloadPackageLockCommandOptions =
  CommandExecuteOptions
  & {
    uri: string
    directory: string
    force?: boolean
  }

export default class NpmDownloadPackageLockCommand implements Command {
  get definition() {
    return {
      name: 'package-lock',
      flags: '<uri>',
      description: 'download tarballs based on a package-lock.json',
      options: [
        directoryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadPackageLockCommandOptions) {
    const { body: packageLock } = await fetch<NpmPackageManifest>(options);
    return downloadFromPackageLock(packageLock, options.directory, options);
  }
}
