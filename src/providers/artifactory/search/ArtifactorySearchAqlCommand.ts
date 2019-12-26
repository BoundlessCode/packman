import { readFileSync } from 'graceful-fs';
import isValidPath from 'is-valid-path';

import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { runQuery, ArtifactoryOptions, artifactoryOptions } from '../artifactory-utils';

export type ArtifactorySearchAqlCommandOptions =
  GlobalOptions
  & ArtifactoryOptions
  & {
    aql: string
  }

export default class ArtifactorySearchAqlCommand implements Command {
  get definition() {
    return {
      name: 'aql',
      flags: '<server> <aql>',
      description: 'execute the specified aql query',
      options: [
        ...artifactoryOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: ArtifactorySearchAqlCommandOptions) {
    const { aql, logger } = options;

    logger.info(options);

    const query =
      isValidPath(aql)
        ? readFileSync(aql, 'utf8')
        : aql;

    logger.info(`Querying Artifactory for ${aql}`);
    const { results } = await runQuery(query, options);
    logger.info(results);

    return results;
  }
}
