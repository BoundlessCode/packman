require('colors');

const NpmPublishTarballsCommand = require('./NpmPublishTarballsCommand');

/**
 * @param {string} packagesPath
 * @param {string} registry
 * @param {boolean} distTag
 */
async function publishTarballsCommand({ packagesPath, registry, distTag = true }) {
  const command = new NpmPublishTarballsCommand({ packagesPath, registry, distTag });
  return await command.execute();
}

module.exports = {
  publishTarballsCommand,
};
