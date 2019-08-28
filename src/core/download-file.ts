import fs from 'fs';
import url from 'url';
import http from 'http';
import https from 'https';
import mkdirp from 'mkdirp';
import { join } from 'path';

import { LoggerOptions } from './logger';

export type DownloadFileOptions = LoggerOptions & {
  filename?: string
  directory: string
  timeout?: number
  force?: boolean
}

export default function downloadFileAsync(file: string, options: DownloadFileOptions): Promise<{ path: string, duration: number }> {
  const { logger } = options;
  const uri = file.split('/');
  options.filename = options.filename || uri[uri.length - 1];
  options.timeout = options.timeout || 20000;
  const { force } = options;

  const path = join(options.directory, options.filename);

  if (fs.existsSync(path)) {
    if (force) {
      logger.info('[force] deleting pre-existing file'.yellow, path);
      fs.unlinkSync(path);
    }
    else {
      logger.info('skipping download'.yellow, path);
      return Promise.resolve({ path, duration: 0 });
    }
  }

  let req;
  if (url.parse(file).protocol === null) {
    file = `http://${file}`;
    req = http;
  } else if (url.parse(file).protocol === 'https:') {
    req = https;
  } else {
    req = http;
  }
  const start = Date.now();
  return new Promise((resolve, reject) => {
    let fileClose: any;
    let responseEnd: any;
    const promises = [
      new Promise(x => fileClose = x),
      new Promise(x => responseEnd = x),
    ];
    const request = req.get(file, (response) => {
      if (response.statusCode === 200) {
        mkdirp(options.directory, (error: Error) => {
          if (error) {
            reject(error.message);
          }
          const file = fs.createWriteStream(path);
          response.pipe(file);
          file.on('close', fileClose);
        });
      } else {
        reject(response.statusCode);
      }
      response.on('end', responseEnd);
    });
    request.setTimeout(options.timeout, () => {
      request.abort();
      reject(`Timed out after ${options.timeout}ms`);
    });
    request.on('error', (error: Error) => reject(error));
    Promise.all(promises).then(() => {
      const duration = Date.now() - start;
      resolve({ path, duration });
    });
  });
}
