import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions, forceOption, registryOption } from '../../../core/commandOptions';
import { generatePackageJson } from './npm-search';
import { getPackageJsonDependencies } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadSearchCommandOptions = CommandExecuteOptions & {
  registry: string
  directory: string
  keyword: string
  devDependencies: boolean
  peerDependencies: boolean
  force?: boolean
}

export default class NpmDownloadSearchCommand implements Command {
  get definition() {
    return {
      name: 'search',
      flags: '<keyword>',
      description: 'download tarballs based on a npm registry search results',
      options: [
        registryOption,
        forceOption,
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadSearchCommandOptions) {
    const { keyword, force = false, registry, logger } = options;
    const packageJson = await generatePackageJson({
      keyword,
      registry,
    });
    const tarballsSet = await getPackageJsonDependencies({
      packageJson,
      devDependencies: options.devDependencies,
      peerDependencies: options.peerDependencies,
      registry,
      logger,
    });
    return downloadFromIterable(tarballsSet, options.directory, { force, logger });
  }
}
