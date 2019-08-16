const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

class Bundler {
  async bundle(options) {
    const { directory, bundleName, logger } = options;

    logger.debug('options', options);
    logger.debug('directory', directory);
    logger.debug('bundleName', bundleName);

    const targetDirectory = directory || process.cwd();
    const { name: directoryName } = path.parse(targetDirectory || '');

    const targetBundleName = bundleName === true ? directoryName || 'packman' : bundleName;
    const { name: fileName, ext } = path.parse(targetBundleName);

    const bundleFileName = `${fileName}${ext || '.zip'}`;
    logger.debug('bundleFileName', bundleFileName);

    if (fs.existsSync(bundleFileName)) {
      return {
        success: false,
        message: `The file ${bundleFileName.magenta} already exists. Aborting.`,
      };
    }

    // create a file to stream archive data to.
    const output = fs.createWriteStream(bundleFileName, { flags: 'wx' });

    const result = await writeArchive(output, logger, directory, bundleName);

    // if(!result.success) {
    //   return result;
    // }

    return result;
  }
}

function createArchive(output, logger, resolve, reject) {
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
  archive.on('error', function (err) {
    logger.debug('archiver error', err);
    reject(err);
    // throw err;
  });

  return archive;
}

function writeArchive(output, logger, directory, bundleName) {
  return new Promise((resolve, reject) => {

    const archive = createArchive(output, logger, resolve, reject);

    // pipe archive data to the file
    archive.pipe(output);

    archive.directory(directory, bundleName);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  });
}

module.exports = Bundler;
