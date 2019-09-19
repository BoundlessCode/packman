import { URL } from 'url';

import { LoggerOptions } from '../../core/logger';
import { fetch } from '../../core/fetcher';
import Cataloger from '../../core/catalog/Cataloger';
import { SslOptions } from '../../core/commandOptions';

export type FetchNexusCatalogOptions =
  LoggerOptions
  & SslOptions
  & {
    repository: string
    endpoint: string
  }

export async function fetchNexusCatalog({ repository, logger, endpoint, lenientSsl }: FetchNexusCatalogOptions) {
  const cataloger = new Cataloger({ logger, logActionsAsInfo: true });
  cataloger.initialize();

  const repositoryUrl = new URL(repository);
  logger.debug('repositoryUrl', repositoryUrl.href);

  const pattern = /(.+)\/repository\/([^\/]+)\/?$/;
  const [, base, repositoryName] = pattern.exec(repositoryUrl.href);
  logger.debug('base:', base, 'repositoryName:', repositoryName);

  const componentsUrl = new URL('service/rest/v1/' + endpoint, base);
  componentsUrl.searchParams.append('repository', repositoryName);

  let done = false;
  let page = 0;

  do {
    page++;
    logger.info(`Downloading page ${page} from ${componentsUrl}`);

    const { body: { items, continuationToken } } = await fetch({
      uri: componentsUrl,
      responseType: 'json',
      lenientSsl,
      logger,
    });
    logger.debug('items in page', items.length);

    for (const { group, name, version } of items) {
      const fullName = group ? `${group}/${name}` : name;
      cataloger.catalog({ name: fullName, version });
    }

    if (continuationToken) {
      componentsUrl.searchParams.set('continuationToken', continuationToken);
    }
    else {
      done = true;
    }
  } while (!done);
}
