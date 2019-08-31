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
  uri: URI
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
    qs,
    timeout,
    logger,
  } = options;

  const uri = normalizeUrl(options.uri);

  const json = options.json || uri.endsWith('json');

  if (fs.existsSync(uri)) {
    logger.debug('fetching local file'.yellow, uri.yellow);
    const content = json ? require(uri) : fs.readFileSync(uri).toString();
    return content as TResponse;
  }

  const requestOptions = {
    method,
    uri,
    qs,
    headers: await getHeaders(options),
    formData: options.formData,
    resolveWithFullResponse: options.responseMode === 'full-response',
    json,
    rejectUnauthorized: options.rejectUnauthorized, // https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
    timeout,
  };

  const summary = `${method} ${uri}${qs || ''}${json ? ' [json]' : ''}${timeout ? ' timeout: ' + timeout : ''}`.yellow;
  
  try {
    logger.debug('fetching:'.yellow, summary, options);
    const response = await request(requestOptions);
    logger.debug('fetched:'.green, summary);
    return response as TResponse;
  } catch (error) {
    logger.error('failed to fetch:'.red, summary, error);
    throw error;
  }
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
  uri: URI
  json?: boolean
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
