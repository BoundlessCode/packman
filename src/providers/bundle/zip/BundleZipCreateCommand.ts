import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import Bundler from '../../../core/Bundler';

export type BundleZipCreateCommandOptions =
  GlobalOptions
  & {
    // repository: string
    directory?: string
    bundleName?: boolean | string
  }

export default class BundleZipCreateCommand implements Command {
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

  async execute(options: BundleZipCreateCommandOptions) {
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
