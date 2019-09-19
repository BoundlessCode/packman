import { LoggerOptions } from '../logger';
import { DirectoryOption, directoryOption } from '../commandOptions';

export type WatchOptions =
  LoggerOptions
  & DirectoryOption
  & {
    poll?: boolean;
  };

const pollOption = '--poll';

export const watchOptions = [
  directoryOption,
  pollOption,
];
