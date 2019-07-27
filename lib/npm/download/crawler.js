const request = require('request-promise');
const semver = require('semver');
const util = require('util');
require('colors');

const NpmPackageProvider = require('../NpmPackageProvider');

const provider = new NpmPackageProvider();
const { defaultRegistry, maxRetries, requestTimeout } = provider;

let cacheHits = 1;
let registryHits = 1;

const packagesCache = new Map();
const tarballs = new Set();

/**
 * @typedef DependenciesOptions
 * @property {string} name
 * @property {string} version
 * @property {boolean} devDependencies
 * @property {boolean} peerDependencies
 * @property {string} outputPrefix
 * @property {string} registry
 * @property {Logger} logger
 *
 * @param { DependenciesOptions } options
 * @returns { Promise<Set<string>> }
 */
async function getDependencies(options) {
  const { registry, logger } = options;
  const packageJson = await _retrievePackageVersion(options);
  if (!packageJson) {
    logger.error('ERROR'.red, 'failed to retrieve version of package', options.name, options.version, 'from registry', options.registry);
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

/**
 * @typedef PackageJsonDependenciesOptions
 * @property packageJson
 * @property {boolean} devDependencies
 * @property {boolean} peerDependencies
 * @property {string} registry
 * @property {Logger} logger
 *
 * @param { PackageJsonDependenciesOptions } options
 */
async function getPackageJsonDependencies(options) {
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

async function _retrievePackageVersion({ name, version, outputPrefix = '', registry = defaultRegistry, logger }) {
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

/**
 * @typedef DependenciesOptions
 * @property {string} name
 * @property {string} version
 * @property {boolean} devDependencies
 * @property {boolean} peerDependencies
 * @property {string} outputPrefix
 * @property {string} registry
 *
 * @param { string } searchResults
 * @param { DependenciesOptions } options
 * @returns { Promise<Set<string>> }
 */
async function getDependenciesFromSearchResults(searchResults, options) {
  const packages = Object.values(searchResults)
    .filter(current => current instanceof Object);

  const dependenciesObject = packages.reduce((memo, current) => {
    const version = _getMaxSatisfyingVersion(current);
    memo[current.name] = version;
    return memo;
  }, {});

  await _getDependenciesFrom(dependenciesObject, '', options.registry, logger);

  return tarballs;
}

async function _getDependenciesFrom(dependenciesObject, outputPrefix, registry = defaultRegistry, logger) {
  const dependencies = Object.keys(dependenciesObject || {});
  await Promise.all(dependencies.map(dependency => getDependencies({
    name: dependency,
    version: dependenciesObject[dependency],
    outputPrefix,
    registry,
    logger,
  })));
}

function _getMaxSatisfyingVersion(allPackageVersionsDetails, version) {
  if (util.isNullOrUndefined(version)) {
    return allPackageVersionsDetails['dist-tags'].latest;
  }
  const versions = Object.keys(allPackageVersionsDetails.versions);
  return semver.maxSatisfying(versions, version);
}

async function _retryGetRequest(uri, count, logger) {
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

module.exports = {
  getDependencies,
  getPackageJsonDependencies,
  getDependenciesFromSearchResults,
};
