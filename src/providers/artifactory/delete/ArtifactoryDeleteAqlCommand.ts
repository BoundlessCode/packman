import { readFileSync } from 'graceful-fs';
import isValidPath from 'is-valid-path';

import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { runQuery, deleteArtifact } from '../artifactory-utils';

export type ArtifactoryDeleteAqlCommandOptions =
  GlobalOptions
  & {
    // server: string
    // repo: string
    // packageType: string
    apiKey?: string
    // byChecksum?: boolean
    // force?: boolean
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
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryDeleteAqlCommandOptions) {
    const { aql, logger } = options;

    const query =
      isValidPath(aql)
        ? readFileSync(aql, 'utf8')
        : aql;

    logger.info(`Querying Artifactory for ${aql}`);
    const { results } = await runQuery(query, options);
    logger.info(results);

    for (const item of results) {
      logger.info('Deleting', item);
      await deleteArtifact(item, options);
      logger.info('Deleted'.green, item);
    }
  }
}
