class PackageProvider {
    constructor({ defaultRegistry } = {}) {
        this.defaultRegistry = defaultRegistry;
        this.maxRetries = 5;
        this.requestTimeout = 30000;
    }
}

module.exports = PackageProvider;
