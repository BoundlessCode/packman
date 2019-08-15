const { URL } = require('url');

const { retrieveFile } = require('../core/uri-retriever');
const Cataloger = require('../core/Cataloger');

async function fetchNexusCatalog ({ repository, logger, endpoint }) {
  const cataloger = new Cataloger({ logger, logActionsAsInfo: true });
  cataloger.initialize();

  const repositoryUrl = new URL(repository);
  logger.debug('repositoryUrl', repositoryUrl);

  const pattern = /(.+)\/repository\/([^\/]+)\/?$/;
  const [, base, repositoryName] = pattern.exec(repositoryUrl);
  logger.debug('base:', base, 'repositoryName:', repositoryName);

  const componentsUrl = new URL('service/rest/v1/' + endpoint, base);
  componentsUrl.searchParams.append('repository', repositoryName);

  let done = false;
  let page = 0;

  do {
    page++;
    logger.info(`Downloading page ${page} from ${componentsUrl}`);

    const { items, continuationToken } = await retrieveFile(componentsUrl, { json: true, logger });
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

module.exports = {
  fetchNexusCatalog,
}
