const PackageProvider = require('../../core/PackageProvider');

class NugetPackageProvider extends PackageProvider {
  constructor() {
    // super('https://api.nuget.org/v3/index.json');
    super({ defaultRegistry: 'https://api.nuget.org/' });
  }

  async getRegistry({ registry }) {
    return registry || this.defaultRegistry;
  }
}

module.exports = NugetPackageProvider;
