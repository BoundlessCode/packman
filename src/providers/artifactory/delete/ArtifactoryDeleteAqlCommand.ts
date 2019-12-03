import { readFileSync } from 'graceful-fs';
import isValidPath from 'is-valid-path';

import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, ForceOption, forceOption } from '../../../core/commandOptions';
import { runQuery, deleteArtifact } from '../artifactory-utils';

export type ArtifactoryDeleteAqlCommandOptions =
  GlobalOptions
  & ForceOption
  & {
    // server: string
    // repo: string
    // packageType: string
    apiKey?: string
    // byChecksum?: boolean
    force?: boolean
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
        {
          flags: '--api-key <apiKey>',
          description: 'your API Key, as specified on your user profile page in Artifactory',
        },
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryDeleteAqlCommandOptions) {
    const { aql, force, logger } = options;

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
