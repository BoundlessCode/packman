import { CommandOption, GlobalOptions } from './commandOptions'

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

export interface HasCommandDefinition {
  readonly definition: CommandDefinition;
}

export default interface Command extends HasCommandDefinition {
  execute(options: GlobalOptions): Promise<any>;
}
