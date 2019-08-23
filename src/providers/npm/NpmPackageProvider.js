const PackageProvider = require('../../core/PackageProvider');

class NpmPackageProvider extends PackageProvider {
  constructor() {
    super({ defaultRegistry: 'http://registry.npmjs.org' });
  }
}

module.exports = NpmPackageProvider;
