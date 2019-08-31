import axios, { AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { WriteStream, existsSync, readFileSync } from 'fs';
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
  responseType?: 'json' | 'text' | 'stream'
  useBasicAuthHeader?: boolean
  rejectUnauthorized?: boolean
  timeout?: number
  responseMode?: 'body' | 'full-response'
}

export type FetchResponse = {
  statusCode: number
  data: {}
}

export type FetchPipedResponse = FetchResponse & {
  data: {
    pipe: (stream: WriteStream) => void
  }
}

export const DEFAULT_TIMEOUT = 30000;

let activeRequests = 0;

export async function fetch<TResponse>(options: FetchOptions): Promise<TResponse> {
  const {
    method = 'GET',
    qs,
    timeout = DEFAULT_TIMEOUT,
    responseType = 'json',
    logger,
  } = options;

  const uri = normalizeUrl(options.uri);

  const json = responseType === 'json' || uri.endsWith('json');

  if (existsSync(uri)) {
    logger.debug('fetching local file'.yellow, uri.yellow);
    const content = json ? require(uri) : readFileSync(uri).toString();
    return content as TResponse;
  }

  const resolveWithFullResponse = options.responseMode === 'full-response';

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

  const summary = `${method} ${uri}${qs || ''} [type:${responseType}] [timeout:${timeout}]`.yellow;

  try {
    activeRequests++;
    logger.debug(`fetching [${activeRequests}]:`.yellow, summary, options);
    const response = await instance.request<TResponse>(requestOptions);
    activeRequests--;
    logger.debug(`fetched [${activeRequests}]:`.green, summary);
    return (resolveWithFullResponse ? response : response.data) as TResponse;
  } catch (error) {
    activeRequests--;
    logger.error(`failed to fetch [${activeRequests}]:`.red, summary, error);
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
