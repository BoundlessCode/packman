import { CommandDefinition, HasCommandDefinition } from './Command';

export type PackageProviderOptions = {
    defaultRegistry?: string
}

export default abstract class PackageProvider implements HasCommandDefinition {
    defaultRegistry?: string;
    maxRetries: number = 5;
    requestTimeout: number = 30000;
    
    constructor({ defaultRegistry }: PackageProviderOptions = {}) {
        this.defaultRegistry = defaultRegistry;
    }

    abstract get definition(): CommandDefinition;
}
