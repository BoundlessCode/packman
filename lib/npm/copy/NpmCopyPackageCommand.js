const dayjs = require('dayjs');

const Command = require('../../core/Command');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageCommand } = require('../download/commands');
const { publishTarballsCommand } = require('../publish/commands');

class NpmCopyPackageCommand extends Command {
  constructor(name, version, options = {}) {
    this.name = name;
    this.version = version;
    this.options = options;
  }

  async execute() {
    log(['copy package'], 'copying package');
    log(['copy package'], 'name', this.name);
    log(['copy package'], 'version', this.version);
    log(['copy package'], 'directory', this.options.direcory);
    log(['copy package'], 'source', this.options.source);
    log(['copy package'], 'target', this.options.target);
    const { source } = this.options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = this.options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy package'], `using the directory ${directory}`);
    const downloads = await packageCommand(this.name, this.version, {
      registry: source,
      directory,
    });
    log(['copy package'], 'downloads', downloads);
    log(['copy package'], 'finished downloading');
    const target = this.options.target || await getCurrentRegistry();
    log(['copy package'], `publishing to the registry ${target}`);
    await publishTarballsCommand({ directory, target, distTag: false });
    log(['copy package'], 'finished copying');
  }
}

module.exports = NpmCopyPackageCommand;
