import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, directoryOption } from '../../../core/commandOptions';
import { fetchNexusCatalog } from '../nexus-utils';

export type NexusCatalogComponentsCommandOptions = CommandExecuteOptions & {
  repository: string
}

export default class NexusCatalogComponentsCommand implements Command {
  get definition() {
    return {
      name: 'components',
      flags: '<repository>',
      description: 'create a catalog of the packages in the specified nexus repository using the components API endpoint',
      options: [
        directoryOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NexusCatalogComponentsCommandOptions) {
    await fetchNexusCatalog({ ...options, endpoint: 'components' });
  }
}
