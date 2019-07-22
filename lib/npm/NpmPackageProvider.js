const PackageProvider = require('../core/PackageProvider');

class NpmPackageProvider extends PackageProvider {
  constructor() {
    super({ defaultRegistry: 'http://registry.npmjs.org' });
  }
}

const provider = new NpmPackageProvider();

module.exports = {
  provider,
};
