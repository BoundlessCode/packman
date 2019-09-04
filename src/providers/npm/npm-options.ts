import { registryOption, directoryOption, forceOption, dependenciesOption, devDependenciesOption, peerDependenciesOption, CommandOption } from '../../core/commandOptions';

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

export type NpmSourceRegistryOption = {
    sourceRegistry: string
}

export type NpmTargetRegistryOption = {
    targetRegistry: string
}

export type NpmCopyOptions =
    NpmDirectoryOption
    & NpmSourceRegistryOption
    & NpmTargetRegistryOption
    & {
    }

export const npmDownloadOptions = [
    registryOption,
    directoryOption,
    forceOption,
] as CommandOption[];

export const sourceRegistryOption = {
    flags: '-s, --source <sourceRegistry>',
    description: 'the source registry from which to copy packages (mandatory)',
};
export const targetRegistryOption = {
    flags: '-t, --target <targetRegistry>',
    description: 'the target registry the packages will be copied to, defaults to current registry',
};

export const npmCopyOptions = [
    directoryOption,
    sourceRegistryOption,
    targetRegistryOption,
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
