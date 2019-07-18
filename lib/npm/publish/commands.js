require('colors');

const { execute } = require('../../core/shell');
const { Publisher } = require('../../core/Publisher');
const { publish } = require('./publisher');

/**
 * @param {string} packagesPath
 * @param {string} registry
 * @param {boolean} distTag
 */
async function publishTarballsCommand({ packagesPath, registry, distTag = true }) {
  const publisher = new NpmPublisher({ packagesPath, registry, distTag });
  await publish(publisher);
}

class NpmPublisher extends Publisher {
  constructor(options) {
    super(options);
  }

  async prepare() { }

  async publish({ packagePath, registry }) {
    registry = registry || this.options.registry;
    await execute(`npm publish ${packagePath} --quiet --registry ${registry}`, { stdio: [0, 1, 2] });
  }
}

module.exports = {
  publishTarballsCommand,
};
