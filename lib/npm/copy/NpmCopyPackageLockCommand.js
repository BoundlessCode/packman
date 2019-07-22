const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, targetRegistryOption } = require('../../core/commandOptions');
const log = require('../../core/logger');
const { getCurrentRegistry } = require('../npm-utils');
const { packageLockCommand } = require('../download/commands');

class NpmCopyPackageLockCommand extends Command {
  get definition() {
    return {
      name: 'package-lock <uri>',
      description: 'copy packages specified in a package-lock.json file to the target registry',
      options: [
        directoryOption,
        targetRegistryOption,
      ],
      action: (uri, command) => this.execute({ uri, ...command }),
    };
  }

  async execute(options = {}) {
    const { uri } = options;
    log(['copy package-lock'], 'copying packages');
    log(['copy package-lock'], 'uri', uri);
    log(['copy package-lock'], 'directory', options.direcory);
    log(['copy package-lock'], 'target', options.target);
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    log(['copy package-lock'], `using the directory ${directory}`);
    const downloads = await packageLockCommand(uri, {
      directory,
    });
    log(['copy package-lock'], 'downloads', downloads);
    log(['copy package-lock'], 'finished downloading');
    const target = options.target || await getCurrentRegistry();
    log(['copy package-lock'], `publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    log(['copy package-lock'], 'finished copying');
  }
}

module.exports = NpmCopyPackageLockCommand;
