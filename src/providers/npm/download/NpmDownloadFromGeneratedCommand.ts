import Command, { GlobalOptions } from '../../../core/Command';
import { globalOptions, directoryOption, forceOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import { NpmDirectoryOption, NpmForceOption } from '../npm-options';
import { downloadFromIterable } from './downloader';
import { endOfLine } from './generator';

export type NpmDownloadFromGeneratedCommandOptions =
  NpmDirectoryOption
  & NpmForceOption
  & GlobalOptions
  & {
    uri: string
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
    const { body: text } = await fetch<string>(options);
    const tarball = text.toString().split(endOfLine);
    return downloadFromIterable(tarball, options.directory, options);
  }
}
