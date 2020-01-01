import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import extractZip from 'extract-zip';
import { promisify } from 'util';

import { LoggerOptions } from '../core/logger';
import { DirectoryOption } from './commandOptions';
import { EventEmitter } from 'events';

type BundleResult = {
  success: boolean
  message?: string
}

type PrepareContextOptions =
  LoggerOptions
  & {
    directory?: string
    bundleName?: boolean | string
  }

type BundleFileName = {
  bundleFileName: string
}

type CommonContext =
  LoggerOptions
  & BundleFileName
  & DirectoryOption

type BundleName = {
  bundleName: string
}

type BundleContext =
  CommonContext
  & BundleName

type ExtractContext =
  CommonContext

type ArchiveOutput = {
  output: EventEmitter
}

type CreateArchiveOptions =
  LoggerOptions
  & ArchiveOutput
  & {
    resolve: ({ success: boolean, message: string }) => any
    reject: (error: Error) => any
  }

type WriteArchiveOptions =
  LoggerOptions
  & ArchiveOutput
  & DirectoryOption
  & BundleName

export default class Bundler {
  prepareContext(options: PrepareContextOptions): BundleContext {
    const { directory, bundleName } = options;

    const logger = options.logger.child({ area: 'bundler' });

    logger.debug('options', options);
    logger.debug('directory', directory);
    logger.debug('bundleName', bundleName);

    const targetDirectory = directory || process.cwd();
    const { name: directoryName } = path.parse(targetDirectory || '');

    let targetBundleName: string = '';
    if(bundleName === true && directoryName) {
      targetBundleName = directoryName;
    }
    else if(typeof bundleName === 'string') {
      targetBundleName = bundleName;
    }
    targetBundleName = targetBundleName || directoryName || 'packman';

    const { name: fileName, ext } = path.parse(targetBundleName);

    const bundleFileName = `${fileName}${ext || '.zip'}`;
    logger.debug('bundleFileName', bundleFileName);

    return {
      bundleFileName,
      bundleName: targetBundleName,
      directory: targetDirectory,
      logger,
    };
  }

  async bundle(context: BundleContext): Promise<BundleResult> {
    const { bundleFileName, bundleName, directory, logger } = context;

    if (fs.existsSync(bundleFileName)) {
      return {
        success: false,
        message: `The file ${bundleFileName.magenta} already exists. Aborting.`,
      };
    }

    // create a file to stream archive data to.
    const output = fs.createWriteStream(bundleFileName, { flags: 'wx' });

    const result = await writeArchive({ output, logger, directory, bundleName });
    return result;
  }

  async extract(context: ExtractContext) {
    const { bundleFileName, directory, logger } = context;

    if (!fs.existsSync(bundleFileName)) {
      return {
        success: false,
        message: `The file ${bundleFileName.magenta} does not exist. Aborting.`,
      };
    }
    
    const targetDirectory = directory || process.cwd();
    logger.debug('targetDirectory', targetDirectory);
    const baseName = path.basename(bundleFileName, '.zip');
    logger.debug('baseName', baseName);
    const extractPath = path.resolve(targetDirectory, baseName);
    logger.debug('extractPath', extractPath);

    try {
      const extract = promisify(extractZip);
      const extracted = await extract(bundleFileName, { dir: extractPath });
      return {
        success: true,
        message: extracted,
      };
    }
    catch (err) {
      throw err;
    }
  }
}

function createArchive({ output, logger, resolve, reject }: CreateArchiveOptions) {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  // listen for all archive data to be written
  // 'close' event is fired only when a file descriptor is involved
  output.on('close', function () {
    logger.debug('archiver has been finalized and the output file descriptor has closed.');
    resolve({
      success: true,
      message: archive.pointer() + ' total bytes',
    });
  });

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  output.on('end', function () {
    logger.debug('Data has been drained');
  });

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', function (err) {
    logger.debug('archiver warning', err);
    reject(err);
    // if (err.code === 'ENOENT') {
    //   // log warning
    // } else {
    //   // throw error
    //   throw err;
    // }
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err: Error) {
    logger.debug('archiver error', err);
    reject(err);
    // throw err;
  });

  return archive;
}

function writeArchive({ output, logger, directory, bundleName }: WriteArchiveOptions): Promise<BundleResult> {
  return new Promise((resolve, reject) => {

    const archive = createArchive({ output, logger, resolve, reject });

    // pipe archive data to the file
    archive.pipe(output);

    archive.directory(directory, bundleName);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  });
}
