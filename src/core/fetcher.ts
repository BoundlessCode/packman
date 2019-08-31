import request from 'request-promise';
import { Headers } from 'request';
import { URL } from 'url';

import { getBasicAuthHeader } from './auth';
import { LoggerOptions } from './logger';

export type FetchOptions = LoggerOptions & {
  method?: 'GET' | 'POST'
  url: string | URL
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
