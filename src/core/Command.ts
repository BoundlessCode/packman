import { LoggerOptions } from './logger';

export type CommandDefinition = {
  name: string
  flags?: string
  description?: string
  alias?: string
  options?: CommandOption[]
  loadChildren?: {
    base: string,
    dir: string,
  }
  children?: CommandDefinition[]
}

export type CommandOption = string | {
  flags: string
  description?: string
}

export type GlobalOptions = LoggerOptions & {
  [name: string]: any
}

export interface HasCommandDefinition {
  readonly definition: CommandDefinition;
}

export default interface Command extends HasCommandDefinition {
  execute(options: GlobalOptions): Promise<any>;
}
