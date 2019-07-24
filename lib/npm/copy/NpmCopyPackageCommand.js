const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, sourceRegistryOption, targetRegistryOption } = require('../../core/commandOptions');
const { log } = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageCommand } = require('../download/commands');
const { publishTarballsCommand } = require('../publish/commands');

class NpmCopyPackageCommand extends Command {
  get definition() {
    return {
      name: 'package <name> [version]',
      description: 'copy packages from one registry to another',
      options: [
        directoryOption,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options = {}) {
    const { name, version } = options;
    log(['copy package'], 'copying package');
    log(['copy package'], 'name', name);
    log(['copy package'], 'version', version);
    log(['copy package'], 'directory', options.direcory);
    log(['copy package'], 'source', options.source);
    log(['copy package'], 'target', options.target);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy package'], `using the directory ${directory}`);
    const downloads = await packageCommand(name, version, {
      registry: source,
      directory,
    });
    log(['copy package'], 'downloads', downloads);
    log(['copy package'], 'finished downloading');
    const target = options.target || await getCurrentRegistry();
    log(['copy package'], `publishing to the registry ${target}`);
    await publishTarballsCommand({ directory, target, distTag: false });
    log(['copy package'], 'finished copying');
  }
}

module.exports = NpmCopyPackageCommand;
