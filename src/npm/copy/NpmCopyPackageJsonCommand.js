const dayjs = require('dayjs');

const Command = require('../../core/Command');
const { directoryOption, sourceRegistryOption, targetRegistryOption, dependenciesOptions } = require('../../core/commandOptions');
const { getCurrentRegistry } = require('../npm-utils');
const NpmDownloadPackageJsonCommand = require('../download/NpmDownloadPackageJsonCommand');
const NpmPublishTarballsCommand = require('../publish/NpmPublishTarballsCommand');

class NpmCopyPackageJsonCommand extends Command {
  get definition() {
    return {
      name: 'package-json',
      flag: '<uri>',
      description: 'copy packages specified in a package.json file to the target registry',
      options: [
        directoryOption,
        ...dependenciesOptions,
        sourceRegistryOption,
        targetRegistryOption,
      ],
    };
  }

  async execute(options = {}) {
    const { uri, logger } = options;
    logger.info('copying packages');
    logger.info('uri', uri);
    logger.info('directory', options.direcory);
    logger.info('source', options.source);
    logger.info('target', options.target);
    logger.info('devDependencies', options.devDependencies);
    logger.info('peerDependencies', options.peerDependencies);
    const { source } = options;
    if (!source) {
      throw new Error('The source registry must be specified');
    }
    const directory = options.directory || `copy-${dayjs().format('YYYYMMDD-HHmmss')}`;
    logger.info(`using the directory ${directory}`);
    const { devDependencies, peerDependencies } = options;
    const downloadCommand = new NpmDownloadPackageJsonCommand();
    const downloads = await downloadCommand.execute({ uri, directory, registry: source, devDependencies, peerDependencies, logger });
    logger.info('downloads', downloads);
    logger.info('finished downloading');
    const target = options.target || await getCurrentRegistry({ logger });
    logger.info(`publishing to the registry ${target}`);
    const publishCommand = new NpmPublishTarballsCommand();
    await publishCommand.execute({ packagesPath: directory, target, distTag: false, logger });
    logger.info('finished copying');
  }
}

module.exports = NpmCopyPackageJsonCommand;
