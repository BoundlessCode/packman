import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { NpmDownloadOptions, npmDownloadOptions, DependenciesOptions, dependenciesOptions } from '../npm-options';
import { getPackageJsonDependencies } from '../crawler';
import { generatePackageJson } from './npm-search';
import { downloadFromIterable } from './downloader';
import NpmDownloadAllCommand from './NpmDownloadAllCommand';

export type NpmDownloadSearchCommandOptions =
  NpmDownloadOptions
  & GlobalOptions
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
        ...dependenciesOptions,
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
    catch (error: any) {
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
