const PackageProvider = require('../../core/PackageProvider');
const { requireCommands } = require('../../core/commandInitializer');

class BundlePackageProvider extends PackageProvider {
  constructor() {
    super();
  }

  get definition() {
    return {
      name: 'bundle',
      description: 'Generate and process packman bundles',
      children: [
        {
          name: 'zip',
          description: 'Create and extract zip files',
          alias: 'z',
          children: requireCommands(__dirname, 'zip'),
        },
      ],
    }
  }
}

module.exports = BundlePackageProvider;
