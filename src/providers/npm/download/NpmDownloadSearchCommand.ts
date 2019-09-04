import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, commonPackageOptions } from '../../../core/commandOptions';
import { npmDownloadOptions, NpmDownloadOptions } from '../npm-options';
import { getPackageJsonDependencies, DependenciesOptions } from '../crawler';
import { generatePackageJson } from './npm-search';
import { downloadFromIterable } from './downloader';
import NpmDownloadAllCommand from './NpmDownloadAllCommand';

export type NpmDownloadSearchCommandOptions =
  NpmDownloadOptions
  & CommandExecuteOptions
  & DependenciesOptions
  & {
    keyword: string
  }

export default class NpmDownloadSearchCommand implements Command {
  get definition() {
    return {
      name: 'search',
      flags: '<keyword>',
      description: 'download tarballs based on a npm registry search results',
      options: [
        ...npmDownloadOptions,
        ...commonPackageOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadSearchCommandOptions) {
    const { logger } = options;

    try {
      const packageJson = await generatePackageJson(options);
      const tarballsSet = await getPackageJsonDependencies({ ...options, packageJson });
      return downloadFromIterable(tarballsSet, options.directory, options);
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
              return values.join(' ').indexOf(options.keyword) > -1;
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
