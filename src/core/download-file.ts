import fs from 'fs';
import url from 'url';
import mkdirp from 'mkdirp';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import { LoggerOptions } from './logger';
import { fetch, FetchPipedResponse } from './fetcher';

const mkdirpAsync = promisify(mkdirp);

export type DownloadFileOptions = LoggerOptions & {
  filename?: string
  directory: string
  timeout?: number
  force?: boolean
}

type DownloadFileResult = {
  path: string
  duration: number
}

export default async function downloadFileAsync(fileUri: string, options: DownloadFileOptions): Promise<DownloadFileResult> {
  const { directory, force, logger } = options;
  const uri = fileUri.split('/');
  options.filename = options.filename || uri[uri.length - 1];
  options.timeout = options.timeout || 20000;

  const path = join(directory, options.filename);

  if (existsSync(path)) {
    if (force) {
      logger.info('[force] deleting pre-existing file'.yellow, path);
      fs.unlinkSync(path);
    }
    else {
      logger.info('skipping download'.yellow, path);
      return { path, duration: 0 };
    }
  }

  if (url.parse(fileUri).protocol === null) {
    fileUri = `http://${fileUri}`;
  }

  const start = Date.now();
  return await new Promise(async (resolve, reject) => {
    let fileClose: any;
    let responseEnd: any;
    const promises = [
      new Promise(x => fileClose = x),
      new Promise(x => responseEnd = x),
    ];

    try {
      const response = await fetch<FetchPipedResponse>({
        uri: fileUri,
        timeout: options.timeout,
        responseMode: 'full-response',
        responseType: 'stream',
        logger,
      });

      if (!existsSync(directory)) {
        await mkdirpAsync(directory);
      }

      const writer = fs.createWriteStream(path);
      writer.on('finish', fileClose);
      writer.on('error', reject);

      // reader is Stream, but ts is not recognizing them as compliant types
      const reader: any = response.data;
      reader.on('end', responseEnd);
      reader.on('error', reject);

      reader.pipe(writer);
    }
    catch (error) {
      reject(error);
    }

    await Promise.all(promises).then(() => {
      const duration = Date.now() - start;
      resolve({ path, duration });
    });
  });
}
