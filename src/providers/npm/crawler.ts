import semver from 'semver';
import util from 'util';
import { URL } from 'url';

import Predicate from '../../core/Predicate';
import { Logger, LoggerOptions } from '../../core/logger';
import { fetch } from '../../core/fetcher';
import NpmPackageProvider from './NpmPackageProvider';
import { DependenciesOptions } from './npm-options';
import NpmDependenciesObject from './NpmDependenciesObject';

const provider = new NpmPackageProvider();
const { defaultRegistry, maxRetries, requestTimeout } = provider;

let cacheHits = 1;
let registryHits = 1;

const packagesCache = new Map();
const tarballs = new Set<string>();

type CommonCrawlOptions =
  LoggerOptions
  & {
    outputPrefix?: string
    registry?: string
  }

type GetDependenciesOptions =
  RetrievePackageVersionOptions
  & DependenciesOptions

export async function getDependencies(options: GetDependenciesOptions): Promise<Set<string>> {
  const packageJson = await _retrievePackageVersion(options);
  if (!packageJson) {
    const { name, version, registry, logger } = options;
    logger.error('ERROR'.red, 'failed to retrieve version of package', name, version, 'from registry', registry || '<current>');
    return new Set();
  }

  if (tarballs.has(packageJson.dist.tarball)) {
    return tarballs;
  }

  tarballs.add(packageJson.dist.tarball);

  return await getPackageJsonDependencies({ ...options, packageJson });
}

type GetPackageJsonDependenciesOptions =
  CommonCrawlOptions
  & DependenciesOptions
  & {
    packageJson: NpmPackageManifest
  }

export async function getPackageJsonDependencies(options: GetPackageJsonDependenciesOptions) {
  await getSelectedDependencies(options);

  return tarballs;
}

async function getSelectedDependencies(options: GetPackageJsonDependenciesOptions) {
  const {
    dependencies = true,
    devDependencies = false,
    peerDependencies = false,

    packageJson,
    logger,
  } = options;

  const { name = '<unknown>' } = packageJson;
  const messageFormat = `getting ${'%s'.magenta} for ${name.yellow}`;

  if (dependencies) {
    logger.info(messageFormat, 'dependencies');
    await _getDependenciesFrom({
      ...options,
      dependenciesObject: packageJson.dependencies,
      outputPrefix: 'dependency',
    });
  }

  if (devDependencies) {
    logger.info(messageFormat, 'devDependencies');
    await _getDependenciesFrom({
      ...options,
      dependenciesObject: packageJson.devDependencies,
      outputPrefix: 'devDependency',
    });
  }

  if (peerDependencies) {
    logger.info(messageFormat, 'peerDependencies');
    await _getDependenciesFrom({
      ...options,
      dependenciesObject: packageJson.peerDependencies,
      outputPrefix: 'peerDependency',
    });
  }
}

type RetrievePackageVersionOptions =
  CommonCrawlOptions
  & NamedObject
  & {
    version?: string
  }

async function _retrievePackageVersion(options: RetrievePackageVersionOptions) {
  const { name, version, outputPrefix = '', registry = defaultRegistry, logger } = options;
  const uri = new URL(name.replace('/', '%2F'), registry).href;

  const formattedOutputPrefix = outputPrefix.length > 0 ? outputPrefix.magenta + ' ' : '';
  const retrievingMessage = `retrieving ${formattedOutputPrefix}${name.cyan} ${(version || '').cyan}`;

  if (packagesCache.has(name)) {
    logger.info('cache'.yellow, cacheHits, retrievingMessage);
    cacheHits++;
    const allPackageVersionsDetails = packagesCache.get(name);
    const maxSatisfyingVersion = _getMaxSatisfyingVersion(allPackageVersionsDetails, version);
    return allPackageVersionsDetails.versions[maxSatisfyingVersion];
  }

  logger.info('registry'.blue, registryHits, retrievingMessage);
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
  version: string
  devDependencies: boolean
  peerDependencies: boolean
  outputPrefix: string
  registry: string
}

export type SearchResults = {
  [name: string]: PackageObject
}

type GetDependenciesFromSearchResultsOptions =
  CommonCrawlOptions
  & DependenciesOptions
  & {
    filters?: Iterable<Predicate<PackageObject>>
  }

export async function getDependenciesFromSearchResults(searchResults: SearchResults, options: GetDependenciesFromSearchResultsOptions): Promise<Set<string>> {
  const {
    filters = [],
  } = options;

  const allFilters: Predicate<PackageObject>[] = [
    currentPackage => currentPackage instanceof Object,
    ...filters,
  ];
  const compositeFilter: Predicate<PackageObject> = currentPackage => allFilters.every(filter => filter(currentPackage));

  const packages = Object.values(searchResults)
    .filter(currentPackage => compositeFilter(currentPackage));

  const dependenciesObject = packages.reduce<NpmDependenciesObject>((memo: NpmDependenciesObject, current: NamedObject) => {
    const version = _getMaxSatisfyingVersion(current);
    memo[current.name] = version;
    return memo;
  }, {});

  await _getDependenciesFrom({ ...options, dependenciesObject });

  return tarballs;
}

type GetDependenciesFromOptions =
  CommonCrawlOptions
  & {
    dependenciesObject?: NpmDependenciesObject
  }

async function _getDependenciesFrom(options: GetDependenciesFromOptions) {
  const {
    dependenciesObject = {},
    registry = defaultRegistry,
  } = options;
  const dependencies = Object.keys(dependenciesObject);
  await Promise.all(dependencies.map(dependency => getDependencies({
    ...options,
    name: dependency,
    version: dependenciesObject[dependency],
    registry,
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
    const { body } = await fetch<any>({
      uri,
      responseType: 'json',
      timeout: requestTimeout,
      logger,
    });
    if (count < maxRetries) {
      logger.info(`download success:`.green, uri, count);
    }
    return body;
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
