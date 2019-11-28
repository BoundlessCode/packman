import { readFileSync } from 'graceful-fs';

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
    aql?: string
    aqlFile?: string
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
        {
          flags: '--aql <query>',
          description: 'an AQL query (such as: \'items.find({ "repo": "npm" }).include("repo", "name"))\'',
        },
        {
          flags: '--aql-file <path>',
          description: 'the path of a file containing an AQL query',
        },
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactoryDeleteAqlCommandOptions) {
    const { aql, aqlFile, logger } = options;

    if (!!aql === !!aqlFile) {
      logger.error('One of these arguments must be specified: aql, aql-file');
      return;
    }

    const query =
      aqlFile
        ? readFileSync(aqlFile, 'utf8') as string
        : aql as string;

    const { results } = await runQuery(query, options);

    for (const item of results) {
      logger.info('Deleting', item);
      await deleteArtifact(item, options);
      logger.info('Deleted'.green, item);
    }
  }
}

type AqlQuery = string;
