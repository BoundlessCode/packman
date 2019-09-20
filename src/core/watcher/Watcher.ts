import { EventEmitter } from 'events';
import chokidar from 'chokidar';

import { WatchOptions } from './watcher-options';

export default class Watcher {
  watch(options: WatchOptions): EventEmitter {
    const { directory, poll = true, logger } = options;

    const watcher = chokidar.watch(directory, {
      usePolling: poll,
    });

    const emitter = new EventEmitter();

    watcher
      .on('add', (path) => {
        logger.info('add', path);
        emitter.emit('file', path);
      })
      .on('error', (error) => {
        logger.error(error);
      });

    return emitter;
  }
}