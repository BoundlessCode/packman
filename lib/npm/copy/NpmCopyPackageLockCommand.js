const dayjs = require('dayjs');

const Command = require('../../core/Command');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageLockCommand } = require('../download/commands');

class NpmCopyPackageLockCommand extends Command {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = options;
  }

  async execute() {
    log(['copy package-lock'], 'copying packages');
    log(['copy package-lock'], 'uri', this.uri);
    log(['copy package-lock'], 'directory', this.options.direcory);
    log(['copy package-lock'], 'target', this.options.target);
    const directory = this.options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy package-lock'], `using the directory ${directory}`);
    const downloads = await packageLockCommand(this.uri, {
      directory,
    });
    log(['copy package-lock'], 'downloads', downloads);
    log(['copy package-lock'], 'finished downloading');
    const target = this.options.target || await getCurrentRegistry();
    log(['copy package-lock'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy package-lock'], 'finished copying');
  }
}

module.exports = NpmCopyPackageLockCommand;
