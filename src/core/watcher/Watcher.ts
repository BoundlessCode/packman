import chokidar from 'chokidar';

import { WatchOptions } from './watcher-options';

export default class Watcher {
  watch(options: WatchOptions): Promise<boolean> {
    const { directory, poll = true, logger } = options;

    const watcher = chokidar.watch(directory, {
      usePolling: poll,
    });

    return new Promise((resolve, reject) => {
      watcher
        .on('add', (path) => {
          logger.info('add', path);
        })
        .on('error', (error) => {
          logger.error(error);
          reject(error);
        });
    })
  }
}