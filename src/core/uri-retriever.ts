import fs from 'fs';
import { isAbsolute, join } from 'path';
import { URL } from 'url';

import { LoggerOptions } from '../core/logger';
import { fetch } from '../core/fetcher';

export type URI = string | URL;

export type RetrieveFileOptions = LoggerOptions & {
  json?: boolean
}

export async function retrieveFile(uri: URI, { json = false, logger }: RetrieveFileOptions) {
  const url = normalizeUrl(uri);
  logger.debug('retrieving file', url.yellow)
  if (fs.existsSync(url)) {
    return url.endsWith('json') ? require(url) : fs.readFileSync(url).toString();
  }
  try {
    return await fetch({
      url,
      json: json || url.endsWith('json'),
      logger,
    });
  } catch (error) {
    logger.error(`failed to download the file from ${url}`);
  }
}

function normalizeUrl(uri: URI): string {
  let url: string;
  if (uri instanceof URL) {
    url = uri.href;
  }
  else if (uri.startsWith('http') || isAbsolute(uri)) {
    url = uri;
  }
  else {
    url = join(process.cwd(), uri);
  }
  return url;
}
