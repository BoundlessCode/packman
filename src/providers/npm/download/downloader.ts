import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { URL } from 'url';
import fs from 'fs';
import tar from 'tar';
import semver from 'semver';

import { LoggerOptions, Logger } from '../../../core/logger';
import { fetch } from '../../../core/fetcher';
import downloadFileAsync, { DownloadFileOptions } from '../../../core/download-file';
import NpmPackageManifest from '../NpmPackageManifest';

type TarballInfo = {
  url: string
  directory: string
}

export function downloadFromPackageLock(packageLock, directory: string, options: DownloadTarballsOptions) {
  const tarballs: TarballInfo[] = [];
  _enumerateDependencies(tarballs, packageLock.dependencies);

  return _downloadTarballs(tarballs, directory, options);
}

export function downloadFromIterable(tarballsIterable: Iterable<string> | ArrayLike<string>, directory: string, options: DownloadTarballsOptions) {
  const tarballs = Array.from(tarballsIterable)
    .map(url => ({ url, directory: _convertUrlToDirectory(url) }));
  return _downloadTarballs(tarballs, directory, options);
}

type Dependency = {
  resolved: boolean
  dependencies: {
    [name: string]: string
  }
}

function _enumerateDependencies(tarballs: TarballInfo[], dependencies) {
  for (const [dependencyName, dependency] of Object.entries<Dependency>(dependencies)) {
    if (dependency.resolved) {
      // todo: figure out the right types to replace the double cast
      tarballs.push({ url: dependency.resolved as any as string, directory: dependencyName });
    }
    if (dependency.dependencies) {
      _enumerateDependencies(tarballs, dependency.dependencies);
    }
  }
}

type DownloadTarballsOptions = LoggerOptions & {
  force?: boolean
}

function _downloadTarballs(tarballs: TarballInfo[], baseDirectory = './tarballs', { force = false, logger }: DownloadTarballsOptions) {
  if (!existsSync(baseDirectory)) {
    mkdirSync(baseDirectory);
  }

  logger.info('downloading tarballs'.green, { count: tarballs.length });
  const promises = tarballs.map(async ({ url, directory }, i, arr) => {
    const position = `${i + 1}/${arr.length}`;
    logger.info('downloading'.cyan, position, url);

    const tarballUrl = await getTarballUrl(url, directory, logger);

    if (tarballUrl) {
      return _downloadFileWithRetry(tarballUrl, position, 10, {
        directory: join(baseDirectory, directory),
        force,
        logger,
      });
    }
  });
  return Promise.all(promises);
}

export async function getTarballUrl(tarballUrl: string, directory: string, logger: Logger) {
  logger.debug('get tarball url', tarballUrl, directory);

  const url = new URL(tarballUrl);

  if (url.pathname.endsWith('.tgz')) {
    logger.debug('tarball ends with tgz, returning as is', tarballUrl);
    return tarballUrl;
  }

  const pathParts = url.pathname.split('/');
  const packageVersion = pathParts.pop() as string;

  const packagePath = pathParts.join('/');
  const packageUrl = new URL(packagePath, url.origin);
  logger.debug('fetching package manifest from', packageUrl.href.yellow, 'for version', packageVersion);
  const { body: packageManifest } = await fetch<NpmPackageManifest>({ uri: packageUrl, responseType: 'json', logger });

  if (!packageManifest) {
    logger.info(`Could not retrieve package manifest from '${tarballUrl}'`.yellow);
    return;
  }

  const { versions } = packageManifest;

  if (versions) {
    const versionManifest = versions[packageVersion];
    logger.debug('version manifest', { packageUrl, packageVersion, versionManifest });

    if (!versionManifest) {
      logger.info(`The package '${packageManifest.name}' doesn't seem to have the requested version '${packageVersion}`.yellow);
      return;
    }

    const { dist } = versionManifest;
    logger.debug('dist and tarball properties', dist, dist ? dist.tarball : '<dist is undefined>');
    return dist.tarball;
  }
  else {
    logger.debug('package manifest has no versions');
  }
}

async function _downloadFileWithRetry(url: string, position: string, count: number, options: DownloadFileOptions) {
  const { logger } = options;
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
    const errorMessage = error ? error.message || error : '<no error message>';
    logger.info('failed to download tgz'.red, String(errorMessage).magenta, url, count);
    logger.error(error);
    if (count > 0) {
      return _downloadFileWithRetry(url, position, count - 1, options);
    }
  }
}

function _validateTarball(path: string, logger: Logger) {
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

function _convertUrlToDirectory(url: string) {
  const realUrl = new URL(url);
  const normalizedPath = realUrl
    .pathname.split('/-/')[0]
    .substring(1)
    .replace('%2f', '/');

  const pathParts = normalizedPath.split('/');

  const validVersion = semver.valid(pathParts[pathParts.length - 1]);
  const directoryParts = validVersion ? pathParts.slice(0, -1) : pathParts;
  return directoryParts.join('/');
}
