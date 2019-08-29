import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions, forceOption, registryOption } from '../../../core/commandOptions';
import { generatePackageJson } from './npm-search';
import { getPackageJsonDependencies, DependenciesOptions } from '../crawler';
import { downloadFromIterable } from './downloader';
import NpmDownloadAllCommand from './NpmDownloadAllCommand';

export type NpmDownloadSearchCommandOptions = CommandExecuteOptions & DependenciesOptions & {
  registry: string
  directory: string
  keyword: string
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
    const {
      keyword,
      force = false,
      registry,
      devDependencies,
      peerDependencies,
      directory,
      logger,
    } = options;

    try {
      const packageJson = await generatePackageJson({
        keyword,
        registry,
        logger,
      });
      const tarballsSet = await getPackageJsonDependencies({
        packageJson,
        devDependencies,
        peerDependencies,
        registry,
        logger,
      });
      return downloadFromIterable(tarballsSet, directory, { force, logger });
    }
    catch (error) {
      if (error.statusCode === 404) {
        logger.info('fast search not available, trying alternate method');

        const downloadAllCommand = new NpmDownloadAllCommand();
        const result = await downloadAllCommand.execute({
          ...options,
          filters: [
            currentPackage => {
              const values = [
                'name' in currentPackage ? currentPackage.name : '',
                'description' in currentPackage ? currentPackage.description : '',
                'keywords' in currentPackage ? currentPackage.keywords.join(' ') : '',
              ];
              return values.join(' ').indexOf(keyword) > -1;
            },
          ],
        });
        return result;
      }
      else {
        logger.error(error);
        throw error;
      }
    }
  }
}
