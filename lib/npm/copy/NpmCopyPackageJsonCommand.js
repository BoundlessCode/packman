const dayjs = require('dayjs');

const Command = require('../../core/Command');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageJsonCommand } = require('../download/commands');

class NpmCopyPackageJsonCommand extends Command {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = options;
  }

  async execute() {
    log(['copy package-json'], 'copying packages');
    log(['copy package-json'], 'uri', this.uri);
    log(['copy package-json'], 'directory', this.options.direcory);
    log(['copy package-json'], 'source', this.options.source);
    log(['copy package-json'], 'target', this.options.target);
    log(['copy package-json'], 'devDependencies', this.options.devDependencies);
    log(['copy package-json'], 'peerDependencies', this.options.peerDependencies);
    const { source } = this.options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = this.options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy package-json'], `using the directory ${directory}`);
    const { devDependencies, peerDependencies } = this.options;
    const downloads = await packageJsonCommand(this.uri, {
      directory,
      registry: source,
      devDependencies,
      peerDependencies,
    });
    log(['copy package-json'], 'downloads', downloads);
    log(['copy package-json'], 'finished downloading');
    const target = this.options.target || await getCurrentRegistry();
    log(['copy package-json'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy package-json'], 'finished copying');
  }
}

module.exports = NpmCopyPackageJsonCommand;
