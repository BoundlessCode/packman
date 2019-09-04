import { LoggerOptions } from '../logger';

export type EntryInfo = {
  name: string
  version: string
}

export type Entry = string;

export const DEFAULT_FILE_NAME = '.catalog.packman';

export type CatalogerOptions = LoggerOptions & {
    catalogFile?: string
    logActionsAsInfo?: boolean
}
