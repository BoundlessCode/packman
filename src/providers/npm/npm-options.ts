import { CommandOption } from '../../core/Command';
import { registryOption, directoryOption } from '../../core/commandOptions';


export type NpmRegistryOption = {
    registry?: string
}

export type NpmDirectoryOption = {
    directory: string
}

export type NpmDownloadOptions =
    NpmRegistryOption
    & NpmDirectoryOption
    & {
    }

export const npmDownloadOptions = [
    registryOption,
    directoryOption,
] as CommandOption[];
