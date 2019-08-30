import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, directoryOption } from '../../../core/commandOptions';
import { retrieveFile } from '../../../core/uri-retriever';
import { downloadFromPackageLock } from './downloader';

export type NpmDownloadPackageLockCommandOptions = CommandExecuteOptions & {
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
    const { uri, directory, force = false, logger } = options;
    const packageLock = await retrieveFile(uri, { logger });
    return downloadFromPackageLock(packageLock, directory, { force, logger });
  }
}