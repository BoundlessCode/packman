const dayjs = require('dayjs');

const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageCommand, packageLockCommand } = require('../download/commands');
const { publishNpmCommand } = require('../publish/commands');

/**
 * @param {string} name
 * @param {string} version
 * @param {{ source: string, target: string, directory: string }} source
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

  await publishNpmCommand(directory, target, false);

  log(['migrate package'], 'finished migration');
}

/**
 * @param {string} uri
 * @param {{ target: string, directory: string }} source
 */
async function migratePackageLockCommand(uri, options = {}) {
  log(['migrate package-lock'], 'migrating package');

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

  await publishNpmCommand(directory, target, false);

  log(['migrate package-lock'], 'finished migration');
}

module.exports = {
  migratePackageCommand,
  migratePackageLockCommand,
};
