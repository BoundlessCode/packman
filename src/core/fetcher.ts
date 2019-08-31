import axios, { AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import { isAbsolute, join } from 'path';

import { getBasicAuthHeader } from './auth';
import { LoggerOptions } from './logger';

export type URI = string | URL;

interface Headers {
  [key: string]: any;
}

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

  const resolveWithFullResponse = options.responseMode === 'full-response';
  const responseType = json ? 'json' : 'text';

  const requestOptions: AxiosRequestConfig = {
    url: uri,
    method,
    params: qs,
    headers: await getHeaders(options),
    data: options.formData,
    responseType,
    timeout,
  };

  const { rejectUnauthorized } = options; // https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
  const agentOptions: any = { rejectUnauthorized };
  const config =
    rejectUnauthorized === undefined
      ? undefined
      : {
        httpAgent: new http.Agent(agentOptions),
        httpsAgent: new https.Agent(agentOptions),
      };
  const instance = axios.create(config);

  const summary = `${method} ${uri}${qs || ''}${json ? ' [json]' : ''}${timeout ? ' timeout: ' + timeout : ''}`.yellow;

  try {
    logger.debug('fetching:'.yellow, summary, options);
    const response = await instance.request<TResponse>(requestOptions);
    logger.debug('fetched:'.green, summary);
    return (resolveWithFullResponse ? response : response.data) as TResponse;
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
