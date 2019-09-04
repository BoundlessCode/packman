import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, outputFileOption, dependenciesOptions, registryOption } from '../../../core/commandOptions';
import { getDependencies, DependenciesOptions } from '../crawler';
import { NpmRegistryOption } from '../npm-options';
import { saveToFile } from './generator';

export type NpmDownloadGenerateCommandOptions =
  NpmRegistryOption
  & CommandExecuteOptions
  & DependenciesOptions
  & {
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
        registryOption,
        outputFileOption,
        ...dependenciesOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadGenerateCommandOptions) {
    const tarballsSet = await getDependencies(options);
    saveToFile(Array.from(tarballsSet), options.outputFile);
  }
}
