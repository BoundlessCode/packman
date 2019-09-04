import { CommandOption } from './Command';

export type CommandOptionsObject = {
    [name: string]: string | CommandOption | CommandOption[]
}

export const directoryOption = {
    flags: '--directory [directory]',
    description: 'the local directory in which to store the downloaded packages',
};

export const dependenciesOption = {
    flags: '--dependencies',
    description: 'download dependencies, default value: true'
};
export const devDependenciesOption = {
    flags: '--devDependencies',
    description: 'download devDependencies, default value: false'
};
export const peerDependenciesOption = {
    flags: '--peerDependencies',
    description: 'download peerDependencies, default value: false'
};
export const registryOption = '--registry [registry]';
export const sourceRegistryOption = {
    flags: '-s, --source <sourceRegistry>',
    description: 'the source registry from which to copy packages (mandatory)',
};
export const targetRegistryOption = {
    flags: '-t, --target <targetRegistry>',
    description: 'the target registry the packages will be copied to, defaults to current registry',
};
export const outputFileOption = '--outputFile [outputFile]';
export const catalogOption = '--catalog [catalogFile]';
export const forceOption = '--force';
export const lenientSslOption = '--lenient-ssl';
export const verboseOption = '-v, --verbose';

export const globalOptions = [
    lenientSslOption,
    verboseOption,
] as CommandOption[];
