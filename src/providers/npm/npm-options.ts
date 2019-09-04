import { CommandOption } from '../../core/Command';
import { registryOption, directoryOption, forceOption, dependenciesOption, devDependenciesOption, peerDependenciesOption } from '../../core/commandOptions';

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

export const dependenciesOptions = [
    dependenciesOption,
    devDependenciesOption,
    peerDependenciesOption,
] as CommandOption[];

export const commonPackageOptions = [
    directoryOption,
    ...(dependenciesOptions as CommandOption[]),
] as CommandOption[];
