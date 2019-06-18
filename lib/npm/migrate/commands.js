const dayjs = require('dayjs');

const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageCommand } = require('../download/commands');
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

module.exports = {
  migratePackageCommand,
};
