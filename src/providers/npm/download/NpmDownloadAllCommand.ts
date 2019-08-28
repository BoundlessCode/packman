import { CommandExecuteOptions } from '../../../core/Command';

import Command from '../../../core/Command';
import { globalOptions, registryOption, directoryOption, forceOption } from '../../../core/commandOptions';
import { retrieveFile } from '../../../core/uri-retriever';
import { getCurrentRegistry, getAllEndpointUrl } from '../npm-utils';
import { getDependenciesFromSearchResults } from '../crawler';
import { downloadFromIterable } from './downloader';

export type NpmDownloadAllCommandOptions = CommandExecuteOptions & {
  registry: string
  directory: string
  force?: boolean
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
    const { force = false, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const url = getAllEndpointUrl(registry, { logger });
    const searchResults = await retrieveFile(url, { json: true, logger });
    const packages = await getDependenciesFromSearchResults(searchResults, { ...options, registry });
    return downloadFromIterable(packages, options.directory, { force, logger });
  }
}
