const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, sourceRegistryOption, targetRegistryOption } = require('../../core/commandOptions');
const { getCurrentRegistry } = require('../npm-utils');
const NpmDownloadAllCommand = require('../download/NpmDownloadAllCommand');
const NpmPublishTarballsCommand = require('../publish/NpmPublishTarballsCommand');

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
    const downloadCommand = new NpmDownloadAllCommand();
    const downloads = await downloadCommand.execute({ directory, registry: source, logger });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ packagesPath: directory, target, distTag: false, logger });
    logger.info('finished copying');
  }
}

module.exports = NpmCopyAllCommand;
