import axios, { AxiosRequestConfig, Method, AxiosProxyConfig } from 'axios';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { WriteStream, existsSync, readFileSync } from 'fs';
import { isAbsolute, join } from 'path';

import { fromEntries } from '../shims';

import { getBasicAuthHeader } from './auth';
import { LoggerOptions } from './logger';
import { SslOptions, ProxyOption } from './commandOptions';

export type URI = string | URL;

export type Headers = Map<string, string>;

export type FetchOptions =
  LoggerOptions
  & SslOptions
  & ProxyOption
  & {
    method?: Method
    uri: URI
    qs?: any
    formData?: { [key: string]: any }
    data?: any
    contentType?: string
    responseType?: 'json' | 'text' | 'stream'
    useBasicAuthHeader?: boolean
    timeout?: number
    responseMode?: 'body' | 'full-response'
    headers?: Headers
  }

export type BasicResponse = {
  statusCode: number
  data: {}
}

export type StreamResponse = BasicResponse & {
  data: {
    pipe: (stream: WriteStream) => void
  }
}

interface FetchResponse<T> {
  body: T
  success: boolean
}

export const DEFAULT_TIMEOUT = 30000;

let activeRequests = 0;

export async function fetch<TResponse>(options: FetchOptions): Promise<FetchResponse<TResponse>> {
  const {
    method = 'get',
    qs,
    timeout = DEFAULT_TIMEOUT,
    responseType = 'json',
    proxy,
    logger,
  } = options;

  logger.debug(`fetch timeout: ${timeout}`);

  const uri = normalizeUrl(options.uri);

  const json = responseType === 'json' || uri.endsWith('json');

  if (existsSync(uri)) {
    logger.debug('fetching local file'.yellow, uri.yellow);
    const content = json ? require(uri) : readFileSync(uri).toString();
    return {
      body: content as TResponse,
      success: true,
    };
  }

  const resolveWithFullResponse = options.responseMode === 'full-response';

  const headers = await getHeaders(options);

  const axiosProxy = getAxiosProxy(proxy);
  if(axiosProxy) {
    logger.info('Using the proxy settings:', axiosProxy);
  }

  const requestOptions: AxiosRequestConfig = {
    url: uri,
    method,
    params: qs,
    headers: fromEntries(headers),
    data: options.formData || options.data,
    responseType,
    timeout,
    maxContentLength: Infinity,
    proxy: axiosProxy,
  };

  const { lenientSsl } = options; // https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
  const rejectUnauthorized = lenientSsl === undefined ? undefined : !lenientSsl;
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
    return {
      body: (resolveWithFullResponse ? response : response.data) as TResponse,
      success: response.status >= 200 && response.status < 300,
    };
  } catch (error) {
    activeRequests--;
    logger.error(`failed to fetch [${activeRequests}]:`.red, summary, 'message' in error ? error.message.red : error);
    throw error;
  }
}

async function getHeaders(options: FetchOptions): Promise<Headers> {
  const headers = options.headers || new Map<string, string>();

  if (options.contentType) {
    headers.set('Content-Type', options.contentType);
  }

  if (options.useBasicAuthHeader) {
    headers.set('Authorization', await getBasicAuthHeader());
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

function getAxiosProxy(proxy?: string): AxiosProxyConfig | undefined {
  if(proxy === undefined) {
    return undefined;
  }

  const [host, port] = proxy.split(':');
  return {
    host: host || '127.0.0.1',
    port: Number(port) || 80,
  };
}
