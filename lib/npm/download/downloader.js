const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const URL = require('url');
const fs = require('fs');
const tar = require('tar');
require('colors');

const downloadFileAsync = require('../../core/download-file');

function downloadFromPackageLock(packageLock, directory, logger) {
  const tarballs = [];
  _enumerateDependencies(tarballs, packageLock.dependencies);

  return _downloadTarballs(tarballs, directory, logger);
}

/**
 * @param { Iterable<string> | ArrayLike<string> } tarballsIterable
 * @param { string } directory 
 */
function downloadFromIterable(tarballsIterable, directory, logger) {
  const tarballs = Array.from(tarballsIterable)
    .map(url => ({ url, directory: _convertUrlToDirectory(url) }));
  return _downloadTarballs(tarballs, directory, logger);
}

function _enumerateDependencies(tarballs, dependencies) {
  for (const [dependencyName, dependency] of Object.entries(dependencies)) {
    if (dependency.resolved) {
      tarballs.push({ url: dependency.resolved, directory: dependencyName });
    }
    if (dependency.dependencies) {
      _enumerateDependencies(tarballs, dependency.dependencies);
    }
  }
}

function _downloadTarballs(tarballs, baseDirectory = './tarballs', logger) {
  if (!existsSync(baseDirectory)) {
    mkdirSync(baseDirectory);
  }

  logger.info('downloading tarballs'.green, { count: tarballs.length });
  const promises = tarballs.map(({ url, directory }, i, arr) => {
    const position = `${i + 1}/${arr.length}`;
    logger.info('downloading'.cyan, position, url);

    return _downloadFileWithRetry(url, position, 10, {
      directory: join(baseDirectory, directory),
      logger,
    });
  });
  return Promise.all(promises);  
}

async function _downloadFileWithRetry(url, position, count, options = {}) {
  const { directory, logger } = options;
  try {
    const { path, duration } = await downloadFileAsync(url, options);
    if (!existsSync(path)) {
      throw new Error(`tgz does not exist ${path}`);
    }
    if (_validateTarball(path, logger)) {
      logger.info('downloaded tgz'.green, position, url, `${duration}ms`.gray);
      return { path, url, position, duration };
    }
    else throw new Error('Error downloading tgz, retrying... ');
  } catch (error) {
    logger.info('failed to download tgz'.red, error.message, url, count);
    logger.error(error);
    if (count > 0) {
      return _downloadFileWithRetry(url, position, count - 1, options);
    }
  }
}

function _validateTarball(path, logger) {
  try {
    tar.list({ f: path, sync: true });
    return true;
  } catch (error) {
    logger.info('download error'.red, 'deleting tgz'.yellow, path);
    logger.error(error);
    fs.unlinkSync(path);
    return false;
  }
}

function _convertUrlToDirectory(url) {
  const normalizedPath = URL.parse(url)
    .path.split('/-/')[0]
    .substring(1)
    .replace('%2f', '/');

  const pathParts = normalizedPath.split('/');

  const validVersion = semver.valid(pathParts[pathParts.length - 1]);
  const directoryParts = validVersion ? pathParts.slice(0, -1) : pathParts;
  return directoryParts.join('/');
}

module.exports = {
  downloadFromPackageLock,
  downloadFromIterable,
};
