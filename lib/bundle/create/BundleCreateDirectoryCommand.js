const Command = require('../../core/Command');
const { globalOptions } = require('../../core/commandOptions');
const Bundler = require('../../core/Bundler');

class BundleCreateDirectoryCommand extends Command {
  get definition() {
    return {
      name: 'directory',
      flags: '<directory> [bundleName]',
      description: 'create a packman bundle for the specified directory',
      options: [
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const bundler = new Bundler();

    try {
      console.info('Creating bundle...');
      const { success, message } = await bundler.bundle(options);
      if (success) {
        console.info('The bundle has been created.'.green, message);
      }
      else {
        console.info('The bundle could not be created.'.yellow, message);
      }
    }
    catch (err) {
      console.error(err);
    }
  }
}

module.exports = BundleCreateDirectoryCommand;
