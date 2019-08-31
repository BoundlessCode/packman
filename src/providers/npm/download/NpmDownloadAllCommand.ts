import { CommandExecuteOptions } from '../../../core/Command';

import Command from '../../../core/Command';
import { globalOptions, registryOption, directoryOption, forceOption } from '../../../core/commandOptions';
import { fetchFile } from '../../../core/fetcher';
import { getCurrentRegistry, getAllEndpointUrl } from '../npm-utils';
import { getDependenciesFromSearchResults } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadAllCommandOptions = CommandExecuteOptions & {
  registry: string
  directory: string
  force?: boolean
  filters?: [(currentPackage: any) => boolean]
}

export default class NpmDownloadAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      description: 'download tarballs for all packages hosted by the registry',
      options: [
        registryOption,
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadAllCommandOptions) {
    const { force = false, filters, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const url = getAllEndpointUrl(registry, { logger });
    const searchResults = await fetchFile(url, { json: true, logger });
    const packages = await getDependenciesFromSearchResults(searchResults, { ...options, registry, filters, logger });
    return downloadFromIterable(packages, options.directory, { force, logger });
  }
}
