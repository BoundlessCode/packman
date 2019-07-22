require('colors');

const NexusPublishTarballsCommand = require('./NexusPublishTarballsCommand');

/**
 * @param {string} packagesPath
 * @param {string} registry
 * @param {boolean} distTag
 */
async function publishTarballsCommand({ packagesPath, registry, distTag }) {
  const command = new NexusPublishTarballsCommand({ packagesPath, registry, distTag });
  return await command.execute();
}

module.exports = {
  publishTarballsCommand,
};
