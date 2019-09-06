import Entry from './Entry';

export default interface CatalogPersister {
  readonly target: string;
  load(): Promise<void>;
  exists(): boolean;
  append(entry: Entry): Promise<void>;
  remove(entry: Entry): Promise<void>;
  has(entry: Entry): boolean;
  stream(): Iterable<Entry>;
}
