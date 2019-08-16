const Command = require('../../core/Command');
const { globalOptions } = require('../../core/commandOptions');
const Bundler = require('../../core/Bundler');

class BundleZipCreateCommand extends Command {
  get definition() {
    return {
      name: 'create',
      flags: '<directory> [bundleName]',
      description: 'compress the specified directory',
      options: [
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { logger } = options;

    try {
      logger.info('Creating zip file...');
      const bundler = new Bundler();
      const context = bundler.prepareContext(options);
      const { success, message } = await bundler.bundle(context);
      if (success) {
        logger.info('The zip file has been created.'.green, message);
      }
      else {
        logger.info('Failed to create the zip file.'.yellow, message);
      }
    }
    catch (err) {
      logger.error(err);
    }
  }
}

module.exports = BundleZipCreateCommand;
