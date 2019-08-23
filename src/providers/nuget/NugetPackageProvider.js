const PackageProvider = require('../../core/PackageProvider');
const { requireCommands } = require('../../core/commandInitializer');

class NugetPackageProvider extends PackageProvider {
  constructor() {
    // super('https://api.nuget.org/v3/index.json');
    super({ defaultRegistry: 'https://api.nuget.org/' });
  }

  get definition() {
    return {
      name: 'nuget',
      description: 'Manage nuget packages',
      children: [
        {
          name: 'download',
          description: 'Download packages',
          alias: 'd',
          children: requireCommands(__dirname, 'download'),
        },
        {
          name: 'publish',
          description: 'Publish packages',
          alias: 'p',
          children: requireCommands(__dirname, 'publish'),
        },
      ],
    }
  }

  async getRegistry({ registry }) {
    return registry || this.defaultRegistry;
  }
}

module.exports = NugetPackageProvider;
