import { resolve, isAbsolute } from 'path';
import { once } from 'events';
import { appendFileSync, createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';

import CatalogPersister from './CatalogPersister';
import { Entry, CatalogerOptions, DEFAULT_FILE_NAME } from './types';

export class FileCatalogPersister implements CatalogPersister {
  public get target() {
    return this.fullPath;
  }
  
  private readonly fullPath: string;

  constructor(private options: CatalogerOptions) {
    const { catalogFile = DEFAULT_FILE_NAME } = options;
    this.fullPath =
      isAbsolute(catalogFile)
        ? catalogFile
        : resolve(catalogFile);
  }

  async initialize(entries: Set<Entry>) {
    const { fullPath, options } = this;
    const { logger } = options;

    if (this.exists()) {
      logger.info('loading', fullPath);

      const readline = createInterface({
        input: createReadStream(fullPath),
        crlfDelay: Infinity,
      });

      readline.on('line', (line) => {
        entries.add(line);
        logger.debug('loaded', line, 'to set');
      });

      await once(readline, 'close');

      logger.info('cataloger initialized');
    }
    else {
      logger.info('file does not yet exist:', fullPath);
    }
  }

  exists() {
    return existsSync(this.fullPath);
  }

  append(entry: string) {
    appendFileSync(this.fullPath, entry + '\n', 'utf8');
    this.options.logger.debug('appended to', this.fullPath);
  }
}
