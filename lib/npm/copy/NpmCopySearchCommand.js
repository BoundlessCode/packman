const dayjs = require('dayjs');

const Command = require('../../core/Command');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { searchCommand } = require('../download/commands');

class NpmCopySearchCommand extends Command {
  constructor(keyword, options = {}) {
    this.keyword = keyword;
    this.options = options;
  }

  async execute() {
    log(['copy search'], 'copying packages');
    log(['copy search'], 'keyword', this.keyword);
    log(['copy search'], 'directory', this.options.direcory);
    log(['copy search'], 'source', this.options.source);
    log(['copy search'], 'target', this.options.target);
    log(['copy search'], 'devDependencies', this.options.devDependencies);
    log(['copy search'], 'peerDependencies', this.options.peerDependencies);
    const { source } = this.options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = this.options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy search'], `using the directory ${directory}`);
    const { devDependencies, peerDependencies } = this.options;
    const downloads = await searchCommand(this.keyword, {
      directory,
      registry: source,
      devDependencies,
      peerDependencies,
    });
    log(['copy search'], 'downloads', downloads);
    log(['copy search'], 'finished downloading');
    const target = this.options.target || await getCurrentRegistry();
    log(['copy search'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy search'], 'finished copying');
  }
}

module.exports = NpmCopySearchCommand;
