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
    const bundler = new Bundler();

    try {
      console.info('Creating zip file...');
      const { success, message } = await bundler.bundle(context);
      if (success) {
        console.info('The zip file has been created.'.green, message);
      }
      else {
        console.info('The zip file could not be created.'.yellow, message);
      }
      console.info('The zip file has been created.'.green, message);
    }
    catch (err) {
      console.error(err);
    }
  }
}

module.exports = BundleZipCreateCommand;
