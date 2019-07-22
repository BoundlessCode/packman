const Command = require('../../core/Command');
const { publish } = require('./publisher');
const { NpmPublisher } = require('./NpmPublisher');

class NpmPublishTarballsCommand extends Command {
  constructor(options = {}) {
    this.options = options;
  }

  async execute() {
    const { packagesPath, registry, distTag } = this.options;
    const publisher = new NpmPublisher({ packagesPath, registry, distTag });
    await publish(publisher);
  }
}

module.exports = NpmPublishTarballsCommand;
