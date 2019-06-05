const dayjs = require('dayjs');

const { getCurrentRegistry } = require('../npm-utils');
const { packageCommand } = require('../download/commands');
const { publishNpmCommand } = require('../publish/commands');

/**
 * @param {string} sourceRegistry
 * @param {string} targetRegistry
 */
async function migratePackageCommand(name, version, source, target, options = {}) {
  console.log('migrating package');

  if(!source) {
    throw new Error('The source registry must be specified');
  }

  const directory = options.directory || `migrate-${dayjs().format('YYYYMMDD-HHmmss')}`;
  console.log(`using the directory ${directory}`);

  const downloads = await packageCommand(name, version, {
    registry: source,
    directory,
  });

  console.log('downloads', downloads);
  console.log('finished downloading');

  if(!target) {
    target = getCurrentRegistry();
  }
  console.log(`publishing to the registry ${target}`);

  await publishNpmCommand(directory, target, false);

  console.log('finished migration');
}

module.exports = {
  migratePackageCommand,
};
