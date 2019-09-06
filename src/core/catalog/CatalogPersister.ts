import Entry from './Entry';

export default interface CatalogPersister {
  readonly target: string;
  initialize(): Promise<void>;
  exists(): boolean;
  append(entry: Entry): Promise<void>;
  has(entry: Entry): boolean;
  stream(): Iterable<Entry>;
}
