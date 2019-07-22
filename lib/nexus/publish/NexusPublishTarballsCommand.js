const Command = require('../../core/Command');
const { publish } = require('../../npm/publish/publisher');

class NexusPublishTarballsCommand extends Command {
  constructor(publisher) {
    this.publisher = publisher;
  }

  async execute() {
    await publish(this.publisher);
  }
}

module.exports = NexusPublishTarballsCommand;
