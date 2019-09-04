import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, directoryOption } from '../../../core/commandOptions';
import { fetchNexusCatalog } from '../nexus-utils';

export type NexusCatalogSearchCommandOptions =
  GlobalOptions
  & {
    repository: string
  }

export default class NexusCatalogSearchCommand implements Command {
  get definition() {
    return {
      name: 'search',
      flags: '<repository>',
      description: 'create a catalog of the packages in the specified nexus repository using the search API endpoint',
      options: [
        directoryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NexusCatalogSearchCommandOptions) {
    await fetchNexusCatalog({ ...options, endpoint: 'search' });
  }
}
