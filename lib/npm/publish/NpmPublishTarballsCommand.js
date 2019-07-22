const Command = require('../../core/Command');
const { publish } = require('./publisher');

class NpmPublishTarballsCommand extends Command {
  constructor(publisher) {
    this.publisher = publisher;
  }

  async execute() {
    await publish(this.publisher);
  }
}

module.exports = NpmPublishTarballsCommand;
