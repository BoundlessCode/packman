const request = require('request-promise');
const semver = require('semver');
const util = require('util');
require('colors');

const log = require('../../core/logger');
const { npmRegistry, maxRetries, requestTimeout } = require('./constants');

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
 *
 * @param { DependenciesOptions } options
 * @returns { Promise<Set<string>> }
 */
async function getDependencies(options) {
  const { registry } = options;
  const packageJson = await _retrievePackageVersion(options);
  if (!packageJson) {
    log(['ERROR'.red], 'failed to retrieve version of package', options.name, options.version, 'from registry', options.registry);
    return new Set();
  }
  if (tarballs.has(packageJson.dist.tarball)) return tarballs;

  tarballs.add(packageJson.dist.tarball);

  await _getDependenciesFrom(packageJson.dependencies, 'dependency '.magenta, registry);

  if (options.devDependencies) {
    await _getDependenciesFrom(packageJson.devDependencies, 'devDependency '.magenta, registry);
  }

  if (options.peerDependencies) {
    await _getDependenciesFrom(packageJson.peerDependencies, 'peerDependency '.magenta, registry);
  }

  return tarballs;
}

/**
 * @typedef PackageJsonDependenciesOptions
 * @property packageJson
 * @property {boolean} devDependencies
 * @property {boolean} peerDependencies
 * @property {string} registry
 *
 * @param { PackageJsonDependenciesOptions } options
 */
async function getPackageJsonDependencies(options) {
  const { packageJson, registry } = options;

  await _getDependenciesFrom(packageJson.dependencies, 'dependency '.magenta);

  if (options.devDependencies) {
    await _getDependenciesFrom(packageJson.devDependencies, 'devDependency '.magenta);
  }

  if (options.peerDependencies) {
    await _getDependenciesFrom(packageJson.peerDependencies, 'peerDependency '.magenta);
  }

  return tarballs;
}

async function _retrievePackageVersion({ name, version, outputPrefix = '', registry = npmRegistry }) {
  const uri = `${registry}/${name.replace('/', '%2F')}`;

  if (packagesCache.has(name)) {
    log(['cache'.yellow, cacheHits], `retrieving ${outputPrefix}${name.cyan} ${(version || '').cyan}`);
    cacheHits++;
    const allPackageVersionsDetails = packagesCache.get(name);
    const maxSatisfyingVersion = _getMaxSatisfyingVersion(allPackageVersionsDetails, version);
    return allPackageVersionsDetails.versions[maxSatisfyingVersion];
  }

  log(['registry'.green, registryHits], `retrieving ${outputPrefix}${name.cyan} ${(version || '').cyan}`);
  registryHits++;
  const allPackageVersionsDetails = await _retryGetRequest(uri, maxRetries);
  if (allPackageVersionsDetails) {
    packagesCache.set(name, allPackageVersionsDetails);
    const maxSatisfyingVersion = _getMaxSatisfyingVersion(allPackageVersionsDetails, version);
    return allPackageVersionsDetails.versions[maxSatisfyingVersion];
  }
  else {
    return null;
  }
}

async function _getDependenciesFrom(dependenciesObject, outputPrefix, registry = npmRegistry) {
  const dependencies = Object.keys(dependenciesObject || {});
  await Promise.all(dependencies.map(dependency => getDependencies({
    name: dependency,
    version: dependenciesObject[dependency],
    outputPrefix,
    registry,
  })));
}

function _getMaxSatisfyingVersion(allPackageVersionsDetails, version) {
  if (util.isNullOrUndefined(version)) {
    return allPackageVersionsDetails['dist-tags'].latest;
  }
  const versions = Object.keys(allPackageVersionsDetails.versions);
  return semver.maxSatisfying(versions, version);
}

async function _retryGetRequest(uri, count) {
  try {
    const response = await request({ uri, json: true, timeout: requestTimeout });
    if(count < maxRetries) {
      log([`download success:`.green], uri, count);
    }
    return response;
  } catch (error) {
    const message = (error.cause && error.cause.code) || error.message;
    log([`download failure: ${message}`.red], uri, count);
    if (count > 0) {
      return _retryGetRequest(uri, count - 1);
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
};
