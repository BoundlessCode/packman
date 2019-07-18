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
async function copyPackageCommand(name, version, options = {}) {
  log(['copy package'], 'copying package');

  log(['copy package'], 'name', name);
  log(['copy package'], 'version', version);
  log(['copy package'], 'directory', options.direcory);
  log(['copy package'], 'source', options.source);
  log(['copy package'], 'target', options.target);

  const { source } = options;
  if(!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['copy package'], `using the directory ${directory}`);

  const downloads = await packageCommand(name, version, {
    registry: source,
    directory,
  });

  log(['copy package'], 'downloads', downloads);
  log(['copy package'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['copy package'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['copy package'], 'finished copying');
}

/**
 * @param {string} uri
 * @param {{ target: string, directory: string }} options
 */
async function copyPackageLockCommand(uri, options = {}) {
  log(['copy package-lock'], 'copying packages');

  log(['copy package-lock'], 'uri', uri);
  log(['copy package-lock'], 'directory', options.direcory);
  log(['copy package-lock'], 'target', options.target);

  const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['copy package-lock'], `using the directory ${directory}`);

  const downloads = await packageLockCommand(uri, {
    directory,
  });

  log(['copy package-lock'], 'downloads', downloads);
  log(['copy package-lock'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['copy package-lock'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['copy package-lock'], 'finished copying');
}

/**
 * @param {string} uri
 * @param {{ source: string, target: string, directory: string, devDependencies: boolean, peerDependencies: boolean }} options
 */
async function copyPackageJsonCommand(uri, options = {}) {
  log(['copy package-json'], 'copying packages');

  log(['copy package-json'], 'uri', uri);
  log(['copy package-json'], 'directory', options.direcory);
  log(['copy package-json'], 'source', options.source);
  log(['copy package-json'], 'target', options.target);
  log(['copy package-json'], 'devDependencies', options.devDependencies);
  log(['copy package-json'], 'peerDependencies', options.peerDependencies);

  const { source } = options;
  if (!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['copy package-json'], `using the directory ${directory}`);

  const { devDependencies, peerDependencies } = options;

  const downloads = await packageJsonCommand(uri, {
    directory,
    registry: source,
    devDependencies,
    peerDependencies,
  });

  log(['copy package-json'], 'downloads', downloads);
  log(['copy package-json'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['copy package-json'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['copy package-json'], 'finished copying');
}

/**
 * @param {string} keyword
 * @param {{ source: string, target: string, directory: string, devDependencies: boolean, peerDependencies: boolean }} options
 */
async function copySearchCommand(keyword, options = {}) {
  log(['copy search'], 'copying packages');

  log(['copy search'], 'keyword', keyword);
  log(['copy search'], 'directory', options.direcory);
  log(['copy search'], 'source', options.source);
  log(['copy search'], 'target', options.target);
  log(['copy search'], 'devDependencies', options.devDependencies);
  log(['copy search'], 'peerDependencies', options.peerDependencies);

  const { source } = options;
  if (!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['copy search'], `using the directory ${directory}`);

  const { devDependencies, peerDependencies } = options;

  const downloads = await searchCommand(keyword, {
    directory,
    registry: source,
    devDependencies,
    peerDependencies,
  });

  log(['copy search'], 'downloads', downloads);
  log(['copy search'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['copy search'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['copy search'], 'finished copying');
}

/**
 * @param {{ source: string, target: string, directory: string }} options
 */
async function copyAllCommand(options = {}) {
  log(['copy all'], 'copying packages');

  log(['copy all'], 'directory', options.direcory);
  log(['copy all'], 'source', options.source);
  log(['copy all'], 'target', options.target);

  const { source } = options;
  if (!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
  log(['copy all'], `using the directory ${directory}`);

  const downloads = await allCommand({
    directory,
    registry: source,
  });

  log(['copy all'], 'downloads', downloads);
  log(['copy all'], 'finished downloading');

  const target = options.target || await getCurrentRegistry();
  log(['copy all'], `publishing to the registry ${target}`);

  await publishNpmCommand({ directory, target, distTag: false });

  log(['copy all'], 'finished copying');
}

module.exports = {
  copyPackageCommand,
  copyPackageLockCommand,
  copyPackageJsonCommand,
  copySearchCommand,
  copyAllCommand,
};
