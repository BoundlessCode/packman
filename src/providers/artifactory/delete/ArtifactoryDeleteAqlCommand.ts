import { readFileSync } from 'graceful-fs';
import isValidPath from 'is-valid-path';

import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, ForceOption, forceOption } from '../../../core/commandOptions';
import { deleteArtifact, ArtifactoryOptions, artifactoryOptions } from '../artifactory-utils';
import ArtifactorySearchAqlCommand, { ArtifactorySearchAqlCommandOptions } from '../search/ArtifactorySearchAqlCommand';

export type ArtifactoryDeleteAqlCommandOptions =
  GlobalOptions
  & ForceOption
  & ArtifactoryOptions
  & ArtifactorySearchAqlCommandOptions

export default class ArtifactoryDeleteAqlCommand implements Command {
  get definition() {
    return {
      name: 'aql',
      flags: '<server> <aql>',
      description: 'execute the specified aql query and delete the matching packages',
      options: [
        ...artifactoryOptions,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryDeleteAqlCommandOptions) {
    const { force, logger } = options;

    const search = new ArtifactorySearchAqlCommand();
    const results = await search.execute(options);

    if (force) {
      logger.info('Force enabled: packages will really be deleted!'.red);
    }
    else {
      logger.info('Force disabled: packages will NOT be deleted'.yellow)
    }

    for (const item of results) {
      logger.info('Deleting', item);
      if (force) {
        await deleteArtifact(item, options);
        logger.info('Deleted'.green, item);
      }
    }
  }
}
