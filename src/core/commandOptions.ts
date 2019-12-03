import { LoggerOptions } from './logger';

export type CommandOption = string | {
    flags: string
    description?: string
}

export type CommandOptionsObject = {
    [name: string]: string | CommandOption | CommandOption[]
}

export type CatalogFileOption = {
    catalogFile?: string
}

export type TimeoutOption = {
    timeout?: number
}

export type SslOptions = {
    lenientSsl?: boolean
}

export type ProxyOption = {
    proxy?: string
}

export type ForceOption = {
    force?: boolean
}

export type DirectoryOption = {
    directory: string
}

export type GlobalOptions =
    LoggerOptions
    & TimeoutOption
    & SslOptions
    & ProxyOption
    & {
        [name: string]: any
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
export const outputFileOption = '--outputFile [outputFile]';
export const catalogOption = '--catalog [catalogFile]';
export const forceOption = '--force';
export const timeoutOption = '--timeout';
export const lenientSslOption = '--lenient-ssl';
export const verboseOption = '-v, --verbose';
export const proxyOption = {
    flags: '--proxy <proxy>',
    description: 'Specify the proxy in the host:port format',
}
export const globalOptions = [
    timeoutOption,
    lenientSslOption,
    proxyOption,
    verboseOption,
] as CommandOption[];
