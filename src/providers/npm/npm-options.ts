import { CommandOption } from '../../core/Command';
import { registryOption, directoryOption, forceOption } from '../../core/commandOptions';

export type DependenciesOptions = {
    dependencies?: boolean
    devDependencies?: boolean
    peerDependencies?: boolean
}

export type NpmRegistryOption = {
    registry?: string
}

export type NpmDirectoryOption = {
    directory: string
}

export type NpmForceOption = {
    force?: boolean
}

export type NpmDownloadOptions =
    NpmRegistryOption
    & NpmDirectoryOption
    & NpmForceOption
    & {
    }

export const npmDownloadOptions = [
    registryOption,
    directoryOption,
    forceOption,
] as CommandOption[];
