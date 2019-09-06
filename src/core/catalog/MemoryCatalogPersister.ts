import { LoggerOptions } from '../logger';
import CatalogPersister from './CatalogPersister';
import Entry from './Entry';

export type MemoryCatalogPersisterOptions =
  LoggerOptions
  & {
  }

export default class MemoryCatalogPersister implements CatalogPersister {
  private readonly entries: Set<Entry>;

  public get target() {
    return '<memory>';
  }

  constructor(private options: MemoryCatalogPersisterOptions) {
    this.entries = new Set();
  }

  async load() {
    this.options.logger.debug('memory persister initialized');
  }

  exists() {
    return true;
  }

  async append(entry: Entry) {
    this.entries.add(entry);
    this.options.logger.debug(`${entry} was added to the set`.green);
  }

  async remove(entry: Entry) {
    this.entries.delete(entry);
  }

  has(entry: Entry): boolean {
    return this.entries.has(entry);
  }

  * stream() {
    yield* this.entries.values();
  }
}
