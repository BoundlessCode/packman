const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, sourceRegistryOption, targetRegistryOption } = require('../../core/commandOptions');
const { log } = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { allCommand } = require('../download/commands');

class NpmCopyAllCommand extends Command {
  get definition() {
    return {
      name: 'all',
      description: 'copy packages returned by the /-/all endpoint to the target registry',
      options: [
        directoryOption,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute({options = {}}) {
    log(['copy all'], 'copying packages');
    log(['copy all'], 'directory', options.direcory);
    log(['copy all'], 'source', options.source);
    log(['copy all'], 'target', options.target);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy all'], `using the directory ${directory}`);
    const downloads = await allCommand({
      directory,
      registry: source,
    });
    log(['copy all'], 'downloads', downloads);
    log(['copy all'], 'finished downloading');
    const target = options.target || await getCurrentRegistry();
    log(['copy all'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy all'], 'finished copying');
  }
}

module.exports = NpmCopyAllCommand;
