const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, sourceRegistryOption, targetRegistryOption, dependenciesOptions } = require('../../core/commandOptions');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { searchCommand } = require('../download/commands');

class NpmCopySearchCommand extends Command {
  get definition() {
    return {
      name: 'search <keyword>',
      description: 'copy packages returned by an npm registry search to the target registry',
      options: [
        directoryOption,
        ...dependenciesOptions,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options = {}) {
    const { keyword } = options;
    log(['copy search'], 'copying packages');
    log(['copy search'], 'keyword', keyword);
    log(['copy search'], 'directory', options.direcory);
    log(['copy search'], 'source', options.source);
    log(['copy search'], 'target', options.target);
    log(['copy search'], 'devDependencies', options.devDependencies);
    log(['copy search'], 'peerDependencies', options.peerDependencies);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy search'], `using the directory ${directory}`);
    const { devDependencies, peerDependencies } = options;
    const downloads = await searchCommand(keyword, {
      directory,
      registry: source,
      devDependencies,
      peerDependencies,
    });
    log(['copy search'], 'downloads', downloads);
    log(['copy search'], 'finished downloading');
    const target = options.target || await getCurrentRegistry();
    log(['copy search'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy search'], 'finished copying');
  }
}

module.exports = NpmCopySearchCommand;
