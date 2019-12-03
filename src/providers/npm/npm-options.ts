import { registryOption, DirectoryOption, directoryOption, forceOption, dependenciesOption, devDependenciesOption, peerDependenciesOption, CommandOption, ForceOption } from '../../core/commandOptions';

export type DependenciesOptions = {
    dependencies?: boolean
    devDependencies?: boolean
    peerDependencies?: boolean
}

export type NpmRegistryOption = {
    registry?: string
}

export type NpmDownloadOptions =
    NpmRegistryOption
    & DirectoryOption
    & ForceOption
    & {
    }

export type NpmSourceRegistryOption = {
    source: string
}

export type NpmTargetRegistryOption = {
    target: string
}

export type NpmCopyOptions =
    DirectoryOption
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
