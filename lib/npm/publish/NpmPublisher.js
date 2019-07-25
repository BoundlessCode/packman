const { execute } = require('../../core/shell');
const Publisher = require('../../core/Publisher');

class NpmPublisher extends Publisher {
  constructor(options) {
    super(options);
  }

  async prepare() { }

  async publish({ packagePath, registry }) {
    registry = registry || this.options.registry;
    await execute(`npm publish ${packagePath} --quiet --registry ${registry}`, { stdio: [0, 1, 2], logger });
  }
}

module.exports = NpmPublisher;
