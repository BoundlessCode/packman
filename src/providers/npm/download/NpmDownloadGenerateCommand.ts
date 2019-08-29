import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, outputFileOption, dependenciesOptions } from '../../../core/commandOptions';
import { getDependencies, DependenciesOptions } from '../crawler';
import { saveToFile } from './generator';

export type NpmDownloadGenerateCommandOptions = CommandExecuteOptions & DependenciesOptions & {
  name: string
  version: string
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
      dependencies,
      devDependencies,
      peerDependencies,
      outputFile,
      logger,
    } = options;
    
    const tarballsSet = await getDependencies({
      name,
      version,
      dependencies,
      devDependencies,
      peerDependencies,
      logger,
    });
    saveToFile(Array.from(tarballsSet), outputFile);
  }
}
