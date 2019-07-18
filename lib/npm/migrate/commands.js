const dayjs = require('dayjs');

const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageCommand, packageLockCommand, packageJsonCommand, searchCommand, allCommand } = require('../download/commands');
const { publishNpmCommand } = require('../publish/commands');

/**
 * @param {string} name
 * @param {string} version
 * @param {{ source: string, target: string, directory: string }} options
 */
async function migratePackageCommand(name, version, options = {}) {
  log(['migrate package'], 'migrating package');

  log(['migrate package'], 'name', name);
  log(['migrate package'], 'version', version);
  log(['migrate package'], 'directory', options.direcory);
  log(['migrate package'], 'source', options.source);
  log(['migrate package'], 'target', options.target);

  const { source } = options;
  if(!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `migrate-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['migrate package'], `using the directory ${directory}`);

  const downloads = await packageCommand(name, version, {
    registry: source,
    directory,
  });

  log(['migrate package'], 'downloads', downloads);
  log(['migrate package'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['migrate package'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['migrate package'], 'finished migration');
}

/**
 * @param {string} uri
 * @param {{ target: string, directory: string }} options
 */
async function migratePackageLockCommand(uri, options = {}) {
  log(['migrate package-lock'], 'migrating packages');

  log(['migrate package-lock'], 'uri', uri);
  log(['migrate package-lock'], 'directory', options.direcory);
  log(['migrate package-lock'], 'target', options.target);

  const directory = options.directory || `migrate-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['migrate package-lock'], `using the directory ${directory}`);

  const downloads = await packageLockCommand(uri, {
    directory,
  });

  log(['migrate package-lock'], 'downloads', downloads);
  log(['migrate package-lock'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['migrate package-lock'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['migrate package-lock'], 'finished migration');
}

/**
 * @param {string} uri
 * @param {{ source: string, target: string, directory: string, devDependencies: boolean, peerDependencies: boolean }} options
 */
async function migratePackageJsonCommand(uri, options = {}) {
  log(['migrate package-json'], 'migrating packages');

  log(['migrate package-json'], 'uri', uri);
  log(['migrate package-json'], 'directory', options.direcory);
  log(['migrate package-json'], 'source', options.source);
  log(['migrate package-json'], 'target', options.target);
  log(['migrate package-json'], 'devDependencies', options.devDependencies);
  log(['migrate package-json'], 'peerDependencies', options.peerDependencies);

  const { source } = options;
  if (!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `migrate-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['migrate package-json'], `using the directory ${directory}`);

  const { devDependencies, peerDependencies } = options;

  const downloads = await packageJsonCommand(uri, {
    directory,
    registry: source,
    devDependencies,
    peerDependencies,
  });

  log(['migrate package-json'], 'downloads', downloads);
  log(['migrate package-json'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['migrate package-json'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['migrate package-json'], 'finished migration');
}

/**
 * @param {string} keyword
 * @param {{ source: string, target: string, directory: string, devDependencies: boolean, peerDependencies: boolean }} options
 */
async function migrateSearchCommand(keyword, options = {}) {
  log(['migrate search'], 'migrating packages');

  log(['migrate search'], 'keyword', keyword);
  log(['migrate search'], 'directory', options.direcory);
  log(['migrate search'], 'source', options.source);
  log(['migrate search'], 'target', options.target);
  log(['migrate search'], 'devDependencies', options.devDependencies);
  log(['migrate search'], 'peerDependencies', options.peerDependencies);

  const { source } = options;
  if (!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `migrate-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['migrate search'], `using the directory ${directory}`);

  const { devDependencies, peerDependencies } = options;

  const downloads = await searchCommand(keyword, {
    directory,
    registry: source,
    devDependencies,
    peerDependencies,
  });

  log(['migrate search'], 'downloads', downloads);
  log(['migrate search'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['migrate search'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['migrate search'], 'finished migration');
}

/**
 * @param {{ source: string, target: string, directory: string }} options
 */
async function migrateAllCommand(options = {}) {
  log(['migrate all'], 'migrating packages');

  log(['migrate all'], 'directory', options.direcory);
  log(['migrate all'], 'source', options.source);
  log(['migrate all'], 'target', options.target);

  const { source } = options;
  if (!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `migrate-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['migrate all'], `using the directory ${directory}`);

  const downloads = await allCommand({
    directory,
    registry: source,
  });

  log(['migrate all'], 'downloads', downloads);
  log(['migrate all'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['migrate all'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['migrate all'], 'finished migration');
}

module.exports = {
  migratePackageCommand,
  migratePackageLockCommand,
  migratePackageJsonCommand,
  migrateSearchCommand,
  migrateAllCommand,
};
