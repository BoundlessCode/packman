import { Entry } from './types';

export default interface CatalogPersister {
  readonly target: string;
  initialize(entries: Set<Entry>): Promise<void>;
  exists(): boolean;
  append(entry: string);
}
