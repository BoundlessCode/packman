import PackageProvider from '../../core/PackageProvider';

export default class NugetPackageProvider extends PackageProvider {
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
          loadChildren: {
            base: __dirname,
            dir: 'download',
          },
        },
        {
          name: 'publish',
          description: 'Publish packages',
          alias: 'p',
          loadChildren: {
            base: __dirname,
            dir: 'publish',
          },
        },
      ],
    }
  }

  async getRegistry({ registry }: { registry: string }): Promise<string> {
    return registry || this.defaultRegistry || '';
  }
}
