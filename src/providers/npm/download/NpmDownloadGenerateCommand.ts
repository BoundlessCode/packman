import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, outputFileOption, dependenciesOptions } from '../../../core/commandOptions';
import { getDependencies } from '../crawler';
import { saveToFile } from './generator';

export type NpmDownloadGenerateCommandOptions = CommandExecuteOptions & {
  name: string
  version: string
  devDependencies: boolean
  peerDependencies: boolean
  outputFile: string
}

export default class NpmDownloadGenerateCommand implements Command {
  get definition() {
    return {
      name: 'generate',
      flags: '<name> [version]',
      description: 'generates the download links for a given package and version',
      options: [
        outputFileOption,
        ...dependenciesOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadGenerateCommandOptions) {
    const {
      name,
      version,
      devDependencies,
      peerDependencies,
      outputFile,
      logger,
    } = options;
    
    const tarballsSet = await getDependencies({
      name,
      version,
      devDependencies,
      peerDependencies,
      logger,
    });
    saveToFile(Array.from(tarballsSet), outputFile);
  }
}
