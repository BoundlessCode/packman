import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import Watcher from '../../../core/watcher/Watcher';
import { WatchOptions, watchOptions } from "../../../core/watcher/watcher-options";
import Bundler from '../../../core/Bundler';

export type WatchCommandOptions =
  WatchOptions
  & GlobalOptions
  & {
  }

export default class WatchBundlesPublishCommand implements Command {
  get definition() {
    return {
      name: 'publish',
      flags: '<directory>',
      description: 'watch a directory for new bundles to publish',
      options: [
        ...watchOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: WatchCommandOptions): Promise<any> {
    const { directory, poll, logger } = options;

    logger.info(`watching ${directory}, polling: ${poll}`);

    const watcher = new Watcher();

    const bundler = new Bundler();

    watcher
      .watch(options)
      .on('file', (file) => {
        logger.info('file', file);
      });
  }
}
