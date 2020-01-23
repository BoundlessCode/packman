import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, DirectoryOption, directoryOption, ForceOption, forceOption } from '../../../core/commandOptions';
import { Fetcher } from '../../../core/fetcher';
import { downloadFromPackageLock } from './downloader';
import NpmPackageManifest from '../NpmPackageManifest';

export type NpmDownloadPackageLockCommandOptions =
  DirectoryOption
  & ForceOption
  & GlobalOptions
  & {
    uri: string
  }

export default class NpmDownloadPackageLockCommand implements Command {
  get definition() {
    return {
      name: 'package-lock',
      flags: '<uri>',
      description: 'download tarballs based on a package-lock.json',
      options: [
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadPackageLockCommandOptions) {
    const fetcher = new Fetcher({
      lenientSsl: options.lenientSsl,
    });
    const { body: packageLock } = await fetcher.fetch<NpmPackageManifest>(options);
    return downloadFromPackageLock(packageLock, options.directory, options);
  }
}
