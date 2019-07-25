const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, sourceRegistryOption, targetRegistryOption } = require('../../core/commandOptions');
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
    const { name, version, logger } = options;
    logger.info('copying package');
    logger.info('name', name);
    logger.info('version', version);
    logger.info('directory', options.direcory);
    logger.info('source', options.source);
    logger.info('target', options.target);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);
    const downloads = await packageCommand(name, version, {
      registry: source,
      directory,
    });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    await publishTarballsCommand({ directory, target, distTag: false });
    logger.info('finished copying');
  }
}

module.exports = NpmCopyPackageCommand;
