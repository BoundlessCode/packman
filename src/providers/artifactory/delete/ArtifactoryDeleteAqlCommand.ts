import { readFileSync } from 'graceful-fs';
import isValidPath from 'is-valid-path';

import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, ForceOption, forceOption } from '../../../core/commandOptions';
import { runQuery, deleteArtifact, ArtifactoryOptions, artifactoryOptions } from '../artifactory-utils';

export type ArtifactoryDeleteAqlCommandOptions =
  GlobalOptions
  & ForceOption
  & ArtifactoryOptions
  & {
    // repo: string
    // packageType: string
    // byChecksum?: boolean
    aql: string
  }

export default class ArtifactoryDeleteAqlCommand implements Command {
  get definition() {
    return {
      name: 'aql',
      flags: '<server> <aql>',
      description: 'execute the specified aql query and delete the matching packages',
      options: [
        // registryOption,
        ...artifactoryOptions,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryDeleteAqlCommandOptions) {
    const { aql, force, logger } = options;

    logger.info(options);

    const query =
      isValidPath(aql)
        ? readFileSync(aql, 'utf8')
        : aql;

    logger.info(`Querying Artifactory for ${aql}`);
    const { results } = await runQuery(query, options);
    logger.info(results);

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
