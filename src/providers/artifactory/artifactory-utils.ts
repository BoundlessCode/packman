import { URL } from 'url';

import { Headers, fetch } from '../../core/fetcher';
import { GlobalOptions, CommandOption } from '../../core/commandOptions';

export type AqlArtifact = any

export type AqlResponse = {
  results: AqlArtifact[]
}

export type ArtifactoryOptions = {
  server: string
  apiKey?: string
}

export const apiKeyOption ={
  flags: '--api-key <apiKey>',
  description: 'your API Key, as specified on your user profile page in Artifactory',
};

export const artifactoryOptions = [
  apiKeyOption
] as CommandOption[];

function createArtifactoryHeaders(apiKey: any) {
  let headers: Headers | undefined = undefined;
  if (apiKey) {
    headers = headers || new Map<string, any>();
    headers.set('X-JFrog-Art-Api', apiKey);
  }
  return headers;
}

export type AqlQueryOptions =
  GlobalOptions
  & ArtifactoryOptions
  & {
  }

export async function runQuery(query: string, options: AqlQueryOptions): Promise<AqlResponse> {
  // const { filePath, fileName, architecture } = packageInfo;
  const { server, apiKey, lenientSsl, proxy, timeout, logger } = options;
  // if(!filePath) {
  //   throw new Error(`filePath is missing, cannot publish package`);
  // }
  // if(!architecture) {
  //   throw new Error(`architecture is missing, cannot publish package`);
  // }
  // const packageName = `${architecture}/${fileName}`;
  // const registry = packageInfo.registry || options.registry;
  // logger.info(`registry: ${registry.green}`);
  // const publishUrl = new URL(packageName, api);

  const normalizedServer = server.endsWith('/') ? server : server + '/';
  const uri = new URL('api/search/aql', normalizedServer);
  // logger.info(`publishing ${filePath} to ${publishUrl.href}`);
  // if (!force && await this.packageVersionExists({ packageName, uri: publishUrl }, options)) {
  //   logger.info('[exists]'.yellow, `${packageName} at ${publishUrl}`);
  //   return;
  // }
  let headers: Headers | undefined = createArtifactoryHeaders(apiKey);
  // const file = createReadStream(filePath);
  // const formData = new FormData();
  // formData.append('file', file);
  // const query = `items.find({
  //   "$and": [
  //     { "repo": "${repo}" },
  //     { "path": "${path}" },
  //     { "modified": "${modified}" }
  //   ]
  // })`

  // const trimmedQuery = query.replace(/[\r\n]/g, ' ');
  logger.debug(`Running AQL query on ${uri.href.yellow}: ${query}`);

  const response = await fetch<AqlResponse>({
    method: 'post',
    uri,
    contentType: 'text/plain',
    responseType: 'json',
    lenientSsl,
    headers,
    data: query,
    proxy,
    timeout,
    logger,
  });

  logger.debug('AQL query result:', response);

  return response.body;
}

export async function deleteArtifact(artifact, options) {
  const { server, lenientSsl, apiKey, timeout, logger } = options;

  // const artifact = {
  //   "results": [
  //     {
  //       "repo": "libs-release-local",
  //       "path": "org/jfrog/artifactory",
  //       "name": "artifactory.war",
  //       "type": "item type",
  //       "size": "75500000",
  //       "created": "2015-01-01T10:10;10",
  //       "created_by": "Jfrog",
  //       "modified": "2015-01-01T10:10;10",
  //       "modified_by": "Jfrog",
  //       "updated": "2015-01-01T10:10;10"
  //     }
  //   ],
  //   "range": {
  //     "start_pos": 0,
  //     "end_pos": 1,
  //     "total": 1
  //   }
  // }

  const { repo, path, name } = artifact;
  const uri = new URL(`${repo}/${path}/${name}`, server);

  const headers = createArtifactoryHeaders(apiKey);

  await fetch({
    method: 'delete',
    uri,
    contentType: 'text/plain',
    responseType: 'json',
    lenientSsl,
    headers,
    timeout,
    logger,
  });
}
