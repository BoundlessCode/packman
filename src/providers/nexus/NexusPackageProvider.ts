import PackageProvider from '../../core/PackageProvider';

export default class NexusPackageProvider extends PackageProvider {
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
          loadChildren: {
            base: __dirname,
            dir: 'catalog',
          },
        },
        {
          name: 'publish',
          description: 'Publish package tarballs',
          alias: 'p',
          loadChildren: {
            base: __dirname,
            dir: 'publish',
          },
        },
      ],
    }
  }
}
