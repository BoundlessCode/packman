import { resolve, isAbsolute } from 'path';
import { once } from 'events';
import { appendFileSync, createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';

import { LoggerOptions } from '../logger';
import CatalogPersister from './CatalogPersister';
import Entry from './Entry';

const DEFAULT_FILE_NAME = '.catalog.packman';

export type FileCatalogPersisterOptions =
  LoggerOptions
  & {
    catalogFile?: string
  }

export default class FileCatalogPersister implements CatalogPersister {
  private readonly fullPath: string;

  public get target() {
    return this.fullPath;
  }

  constructor(
    private options: FileCatalogPersisterOptions,
    private basePersister: CatalogPersister,
  ) {
    const { catalogFile = DEFAULT_FILE_NAME, logger } = options;
    this.fullPath =
      isAbsolute(catalogFile)
        ? catalogFile
        : resolve(catalogFile);
    logger.debug(`file persister using ${this.fullPath}`);
  }

  async initialize() {
    const { basePersister } = this;
    await basePersister.initialize();

    const { fullPath, options } = this;
    const { logger } = options;

    logger.debug('loading file persister');

    if (this.exists()) {
      logger.info(`loading ${fullPath}`);

      const readline = createInterface({
        input: createReadStream(fullPath),
        crlfDelay: Infinity,
      });

      readline.on('line', (line) => {
        basePersister.append(line);
        logger.debug('loaded', line, 'to set');
      });

      await once(readline, 'close');

      logger.info(`finished loading ${fullPath}`);
    }
    else {
      logger.info('file does not yet exist:', fullPath);
    }

    logger.debug('loaded file persister');
  }

  exists() {
    return existsSync(this.fullPath);
  }

  async append(entry: Entry) {
    await this.basePersister.append(entry);
    appendFileSync(this.fullPath, entry + '\n', 'utf8');
    this.options.logger.debug('appended to', this.fullPath);
  }

  has(entry: Entry): boolean {
    return this.basePersister.has(entry);
  }

  * stream(): Iterable<Entry> {
    yield* this.basePersister.stream();
  }
}
