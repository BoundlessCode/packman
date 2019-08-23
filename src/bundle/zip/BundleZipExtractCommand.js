const Command = require('../../core/Command');
const { globalOptions } = require('../../core/commandOptions');
const Bundler = require('../../core/Bundler');

class BundleZipExtractCommand extends Command {
  get definition() {
    return {
      name: 'extract',
      flags: '<bundleName> [directory]',
      description: 'create a packman bundle for the specified directory',
      options: [
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { logger } = options;

    try {
      logger.info('Extracting zip file...');

      const bundler = new Bundler();
      const context = bundler.prepareContext(options);
      const { success, message } = await bundler.extract(context);

      if (!success) {
        logger.info('Failed to extract the zip file.'.yellow, message);
        return;
      }

      logger.info('The zip file has been extracted.'.green, message);
    }
    catch (err) {
      logger.error(err);
    }
  }
}

module.exports = BundleZipExtractCommand;
