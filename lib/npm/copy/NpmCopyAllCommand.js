const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, sourceRegistryOption, targetRegistryOption } = require('../../core/commandOptions');
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
    const { logger } = options;
    logger.info('copying packages');
    logger.info('directory', options.direcory);
    logger.info('source', options.source);
    logger.info('target', options.target);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);
    const downloads = await allCommand({
      directory,
      registry: source,
    });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    await publishNpmCommand({ directory, target, distTag: false });
    logger.info('finished copying');
  }
}

module.exports = NpmCopyAllCommand;
