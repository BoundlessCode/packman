import request from 'request-promise';
import { Headers } from 'request';
import { URL } from 'url';
import fs from 'fs';
import { isAbsolute, join } from 'path';

import { getBasicAuthHeader } from './auth';
import { LoggerOptions } from './logger';

export type URI = string | URL;

export type FetchOptions = LoggerOptions & {
  method?: 'GET' | 'POST'
  url: URI
  qs?: any
  formData?: { [key: string]: any };
  contentType?: string
  json?: boolean
  useBasicAuthHeader?: boolean
  rejectUnauthorized?: boolean
  timeout?: number
  responseMode?: 'body' | 'full-response'
}

export async function fetch<TResponse>(options: FetchOptions): Promise<TResponse> {
  const {
    method = 'GET',
    url,
    qs,
    json,
    timeout,
    logger,
  } = options;

  const requestOptions = {
    method,
    url,
    qs,
    headers: await getHeaders(options),
    formData: options.formData,
    resolveWithFullResponse: options.responseMode === 'full-response',
    json,
    rejectUnauthorized: options.rejectUnauthorized, // https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
    timeout,
  };

  const summary = `${method} ${url}${qs || ''}${json ? ' [json]' : ''}${timeout ? ' timeout: ' + timeout : ''}`.yellow;
  logger.debug('fetching:'.yellow, summary, options);

  const response = await request(requestOptions);

  logger.debug('fetched:'.yellow, summary);

  return response as TResponse;
}

async function getHeaders(options: FetchOptions): Promise<Headers> {
  const headers = new Map<string, string>();

  if (options.contentType) {
    headers.set('content-type', options.contentType);
  }

  if (options.useBasicAuthHeader) {
    headers.set('authorization', await getBasicAuthHeader());
  }

  return headers;
}

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
