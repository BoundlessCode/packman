const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, targetRegistryOption } = require('../../core/commandOptions');
const { getCurrentRegistry } = require('../npm-utils');
const NpmDownloadPackageLockCommand = require('../download/NpmDownloadPackageLockCommand');
const NpmPublishTarballsCommand = require('../publish/NpmPublishTarballsCommand');

class NpmCopyPackageLockCommand extends Command {
  get definition() {
    return {
      name: 'package-lock',
      flags: '<uri>',
      description: 'copy packages specified in a package-lock.json file to the target registry',
      options: [
        directoryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options = {}) {
    const { uri, logger } = options;
    logger.info('copying packages');
    logger.info('uri', uri);
    logger.info('directory', options.direcory);
    logger.info('target', options.target);
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);
    const downloadCommand = new NpmDownloadPackageLockCommand();
    const downloads = await downloadCommand.execute({ uri, directory, logger });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ packagesPath: directory, target, distTag: false, logger });
    logger.info('finished copying');
  }
}

module.exports = NpmCopyPackageLockCommand;
