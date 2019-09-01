import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, directoryOption, forceOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import { downloadFromIterable } from './downloader';
import { endOfLine } from './generator';

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
    const { uri, force, directory, logger } = options;
    const { body: text } = await fetch<string>({ uri, logger });
    const tarball = text.toString().split(endOfLine);
    return downloadFromIterable(tarball, directory, { force, logger });
  }
}
