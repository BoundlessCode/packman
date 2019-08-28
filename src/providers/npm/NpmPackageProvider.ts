import PackageProvider from '../../core/PackageProvider';

export default class NpmPackageProvider extends PackageProvider {
  constructor() {
    super({ defaultRegistry: 'http://registry.npmjs.org' });
  }

  get definition() {
    return {
      name: 'npm',
      description: 'Download package tarballs',
      children: [
        {
          name: 'download',
          description: 'Download package tarballs',
          alias: 'd',
          loadChildren: {
            base: __dirname,
            dir: 'download'
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
        {
          name: 'copy',
          description: 'Download packages from one registry and publish to another',
          alias: 'c',
          loadChildren: {
            base: __dirname,
            dir: 'copy',
          },
        },
        {
          name: 'catalog',
          description: 'Generate a packman catalog for a specified registry',
          alias: 'i',
          loadChildren: {
            base: __dirname,
            dir: 'catalog',
          },
        },
      ],
    };
  }
}
