import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, DirectoryOption, directoryOption, ForceOption, forceOption } from '../../../core/commandOptions';
import { Fetcher } from '../../../core/fetcher';
import { downloadFromIterable } from './downloader';
import { endOfLine } from './generator';

export type NpmDownloadFromGeneratedCommandOptions =
  DirectoryOption
  & ForceOption
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
    const fetcher = new Fetcher({
      lenientSsl: options.lenientSsl,
    });
    const { body: text } = await fetcher.fetch<string>(options);
    const tarball = text.toString().split(endOfLine);
    return downloadFromIterable(tarball, options.directory, options);
  }
}
