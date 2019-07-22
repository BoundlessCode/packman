const Command = require('../../core/Command');
const { publish } = require('../../npm/publish/publisher');

class NexusPublishTarballsCommand extends Command {
  constructor(options = {}) {
    this.options = options;
  }

  async execute() {
    const { packagesPath, registry, distTag } = this.options;
    const publisher = new NexusApiPublisher({ packagesPath, registry, distTag });
    await publish(publisher);
  }
}

module.exports = NexusPublishTarballsCommand;
