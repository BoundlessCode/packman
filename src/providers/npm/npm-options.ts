import { CommandOption } from '../../core/Command';
import { registryOption } from '../../core/commandOptions';

export type NpmDownloadCommandOptions = {
    registry?: string
}

export const npmDownloadOptions = [
    registryOption,
] as CommandOption[];
