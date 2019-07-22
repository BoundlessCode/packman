const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { options } = require('../../core/initializer');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageJsonCommand } = require('../download/commands');

class NpmCopyPackageJsonCommand extends Command {
  get definition() {
    return {
      name: 'package-json <uri>',
      description: 'copy packages specified in a package.json file to the target registry',
      options: [
        options.directoryOption,
        ...options.dependenciesOptions,
        options.sourceRegistryOption,
        options.targetRegistryOption,
      ],
      action: (uri, command) => this.execute({ uri, ...command }),
    };
  }

  async execute(options = {}) {
    const { uri } = options;
    log(['copy package-json'], 'copying packages');
    log(['copy package-json'], 'uri', uri);
    log(['copy package-json'], 'directory', options.direcory);
    log(['copy package-json'], 'source', options.source);
    log(['copy package-json'], 'target', options.target);
    log(['copy package-json'], 'devDependencies', options.devDependencies);
    log(['copy package-json'], 'peerDependencies', options.peerDependencies);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy package-json'], `using the directory ${directory}`);
    const { devDependencies, peerDependencies } = options;
    const downloads = await packageJsonCommand(uri, {
      directory,
      registry: source,
      devDependencies,
      peerDependencies,
    });
    log(['copy package-json'], 'downloads', downloads);
    log(['copy package-json'], 'finished downloading');
    const target = options.target || await getCurrentRegistry();
    log(['copy package-json'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy package-json'], 'finished copying');
  }
}

module.exports = NpmCopyPackageJsonCommand;
