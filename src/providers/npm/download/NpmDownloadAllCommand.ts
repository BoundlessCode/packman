import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { Fetcher } from '../../../core/fetcher';
import { npmDownloadOptions, NpmDownloadOptions } from '../npm-options';
import { getCurrentRegistry, getAllEndpointUrl } from '../npm-utils';
import { getDependenciesFromSearchResults, SearchResults } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadAllCommandOptions =
  NpmDownloadOptions
  & GlobalOptions
  & {
    filters?: [(currentPackage: any) => boolean]
  }

export default class NpmDownloadAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      description: 'download tarballs for all packages hosted by the registry',
      options: [
        ...npmDownloadOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadAllCommandOptions) {
    const registry = options.registry || await getCurrentRegistry(options);
    const uri = getAllEndpointUrl(registry, options);
    const fetcher = new Fetcher({
      lenientSsl: options.lenientSsl,
    });
    const { body: searchResults } = await fetcher.fetch<SearchResults>({ ...options, uri, responseType: 'json' });
    const packages = await getDependenciesFromSearchResults(searchResults, {
      ...options,
      registry,
      dependencies: false,
      devDependencies: false,
      peerDependencies: false,
    });
    return downloadFromIterable(packages, options.directory, options);
  }
}
