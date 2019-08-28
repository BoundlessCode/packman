import request from 'request-promise';
import semver from 'semver';
import util from 'util';
import { URL } from 'url';

import { Logger, LoggerOptions } from '../../core/logger';
import NpmPackageProvider from './NpmPackageProvider';

const provider = new NpmPackageProvider();
const { defaultRegistry, maxRetries, requestTimeout } = provider;

let cacheHits = 1;
let registryHits = 1;

const packagesCache = new Map();
const tarballs = new Set<string>();

type DependenciesOptions = LoggerOptions & {
  name: string
  version?: string
  outputPrefix?: string
  registry?: string
  devDependencies?: boolean
  peerDependencies?: boolean
}

export async function getDependencies(options: DependenciesOptions): Promise<Set<string>> {
  const { registry, logger } = options;
  const packageJson = await _retrievePackageVersion(options);
  if (!packageJson) {
    logger.error('ERROR'.red, 'failed to retrieve version of package', options.name, options.version, 'from registry', options.registry || '<current>');
    return new Set();
  }
  if (tarballs.has(packageJson.dist.tarball)) return tarballs;

  tarballs.add(packageJson.dist.tarball);

  await _getDependenciesFrom(packageJson.dependencies, 'dependency '.magenta, registry, logger);

  if (options.devDependencies) {
    await _getDependenciesFrom(packageJson.devDependencies, 'devDependency '.magenta, registry, logger);
  }

  if (options.peerDependencies) {
    await _getDependenciesFrom(packageJson.peerDependencies, 'peerDependency '.magenta, registry, logger);
  }

  return tarballs;
}

type PackageJsonDependenciesOptions = LoggerOptions & {
  packageJson?: any
  devDependencies?: boolean
  peerDependencies?: boolean
  registry?: string
}

export async function getPackageJsonDependencies(options: PackageJsonDependenciesOptions) {
  const { packageJson, registry, logger } = options;

  await _getDependenciesFrom(packageJson.dependencies, 'dependency '.magenta, registry, logger);

  if (options.devDependencies) {
    await _getDependenciesFrom(packageJson.devDependencies, 'devDependency '.magenta, registry, logger);
  }

  if (options.peerDependencies) {
    await _getDependenciesFrom(packageJson.peerDependencies, 'peerDependency '.magenta, registry, logger);
  }

  return tarballs;
}

type RetrievePackageVersionOptions = LoggerOptions & {
  name: string
  version?: string
  outputPrefix?: string
  registry?: string
}

async function _retrievePackageVersion(options: RetrievePackageVersionOptions) {
  const { name, version, outputPrefix = '', registry = defaultRegistry, logger } = options;
  const uri = new URL(name.replace('/', '%2F'), registry).href;

  if (packagesCache.has(name)) {
    logger.info('cache'.yellow, cacheHits, `retrieving ${outputPrefix}${name.cyan} ${(version || '').cyan}`);
    cacheHits++;
    const allPackageVersionsDetails = packagesCache.get(name);
    const maxSatisfyingVersion = _getMaxSatisfyingVersion(allPackageVersionsDetails, version);
    return allPackageVersionsDetails.versions[maxSatisfyingVersion];
  }

  logger.info('registry'.green, registryHits, `retrieving ${outputPrefix}${name.cyan} ${(version || '').cyan}`);
  registryHits++;
  const allPackageVersionsDetails = await _retryGetRequest(uri, maxRetries, logger);
  if (allPackageVersionsDetails) {
    packagesCache.set(name, allPackageVersionsDetails);
    const maxSatisfyingVersion = _getMaxSatisfyingVersion(allPackageVersionsDetails, version);
    return allPackageVersionsDetails.versions[maxSatisfyingVersion];
  }
  else {
    return null;
  }
}

type NamedObject = {
  name: string
}

type PackageObject = NamedObject & {
  // name: string
  version: string
  devDependencies: boolean
  peerDependencies: boolean
  outputPrefix: string
  registry: string
}

type SearchResults = {
  [name: string]: PackageObject
}

type GetDependenciesFromSearchResultsOptions = LoggerOptions & {
  registry: string
}

type DependenciesObject = {
  [name: string]: string
}

export async function getDependenciesFromSearchResults(searchResults: SearchResults, options: GetDependenciesFromSearchResultsOptions): Promise<Set<string>> {
  const packages = Object.values(searchResults)
    .filter((current: any) => current instanceof Object);

  const dependenciesObject = packages.reduce<DependenciesObject>((memo: DependenciesObject, current: NamedObject) => {
    const version = _getMaxSatisfyingVersion(current);
    memo[current.name] = version;
    return memo;
  }, {});

  await _getDependenciesFrom(dependenciesObject, '', options.registry, options.logger);

  return tarballs;
}

async function _getDependenciesFrom(dependenciesObject: DependenciesObject, outputPrefix: string, registry = defaultRegistry, logger: Logger) {
  const dependencies = Object.keys(dependenciesObject || {});
  await Promise.all(dependencies.map(dependency => getDependencies({
    name: dependency,
    version: dependenciesObject[dependency],
    outputPrefix,
    registry,
    logger,
  })));
}

function _getMaxSatisfyingVersion(allPackageVersionsDetails: any, version?: string) {
  if (util.isNullOrUndefined(version)) {
    return allPackageVersionsDetails['dist-tags'].latest;
  }
  const versions = Object.keys(allPackageVersionsDetails.versions);
  return semver.maxSatisfying(versions, version);
}

async function _retryGetRequest(uri: string, count: number, logger: Logger): Promise<any> {
  try {
    const response = await request({ uri, json: true, timeout: requestTimeout });
    if (count < maxRetries) {
      logger.info(`download success:`.green, uri, count);
    }
    return response;
  } catch (error) {
    const message = (error.cause && error.cause.code) || error.message;
    logger.error(`download failure: ${message}`.red, uri, count);
    if (count > 0) {
      return _retryGetRequest(uri, count - 1, logger);
    }
    if (error.response && error.response.statusCode === 404) {
      return null;
    }
    throw error;
  }
}
