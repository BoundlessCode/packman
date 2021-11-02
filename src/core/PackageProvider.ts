import { DEFAULT_TIMEOUT } from '../core/fetcher';
import { CommandDefinition, HasCommandDefinition } from './Command';

export type PackageProviderOptions = {
    defaultRegistry?: string
}

export default abstract class PackageProvider implements HasCommandDefinition {
    defaultRegistry?: string;
    maxRetries: number = 2;
    requestTimeout: number = DEFAULT_TIMEOUT;
    
    constructor({ defaultRegistry }: PackageProviderOptions = {}) {
        this.defaultRegistry = defaultRegistry;
    }

    abstract get definition(): CommandDefinition;
}
