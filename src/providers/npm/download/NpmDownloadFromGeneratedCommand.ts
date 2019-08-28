import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, directoryOption, forceOption } from '../../../core/commandOptions';
import { downloadFromIterable } from './downloader';
import { readFromFile } from './generator';

export type NpmDownloadFromGeneratedCommandOptions = CommandExecuteOptions & {
  directory: string
  uri: string
  force: boolean
}

export default class NpmDownloadFromGeneratedCommand implements Command {
  get definition() {
    return {
      name: 'from-generated',
      flags: '<uri>',
      description: 'download tarballs using a file created by the generate command',
      options: [
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadFromGeneratedCommandOptions) {
    const { uri, force, logger } = options;
    const tarball = await readFromFile(uri, { logger });
    return downloadFromIterable(tarball, options.directory, { force, logger });
  }
}
