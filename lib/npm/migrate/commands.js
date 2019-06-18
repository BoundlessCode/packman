const dayjs = require('dayjs');

const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageCommand } = require('../download/commands');
const { publishNpmCommand } = require('../publish/commands');

/**
 * @param {string} sourceRegistry
 * @param {string} targetRegistry
 */
async function migratePackageCommand(name, version, source, target, options = {}) {
  log(['migrate package'], 'migrating package');
  
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

  if(!target) {
    target = await getCurrentRegistry();
  }
  log(['migrate package'], `publishing to the registry ${target}`);

  await publishNpmCommand(directory, target, false);

  log(['migrate package'], 'finished migration');
}

module.exports = {
  migratePackageCommand,
};
