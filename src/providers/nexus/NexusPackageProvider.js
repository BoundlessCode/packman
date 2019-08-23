const PackageProvider = require('../../core/PackageProvider');
const { requireCommands } = require('../../core/commandInitializer');

class NexusPackageProvider extends PackageProvider {
  constructor() {
    super();
  }

  get definition() {
    return {
      name: 'nexus',
      description: 'Manage packages hosted on Nexus using the Nexus API',
      children: [
        {
          name: 'catalog',
          description: 'Catalog packages in any nexus repository',
          alias: 'c',
          children: requireCommands(__dirname, 'catalog'),
        },
        {
          name: 'publish',
          description: 'Publish package tarballs',
          alias: 'p',
          children: requireCommands(__dirname, 'publish'),
        },
      ],
    }
  }
}

module.exports = NexusPackageProvider;
