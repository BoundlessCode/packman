const dayjs = require('dayjs');

const Command = require('../../core/Command');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { allCommand } = require('../download/commands');

class NpmCopyAllCommand extends Command {
  constructor(options = {}) {
    this.options = options;
  }

  async execute() {
    log(['copy all'], 'copying packages');
    log(['copy all'], 'directory', this.options.direcory);
    log(['copy all'], 'source', this.options.source);
    log(['copy all'], 'target', this.options.target);
    const { source } = this.options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = this.options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy all'], `using the directory ${directory}`);
    const downloads = await allCommand({
      directory,
      registry: source,
    });
    log(['copy all'], 'downloads', downloads);
    log(['copy all'], 'finished downloading');
    const target = this.options.target || await getCurrentRegistry();
    log(['copy all'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy all'], 'finished copying');
  }
}

module.exports = NpmCopyAllCommand;
