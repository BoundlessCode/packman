import PackageProvider from '../../core/PackageProvider';

export default class BundlePackageProvider extends PackageProvider {
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
          loadChildren: {
            base: __dirname,
            dir: 'zip',
          },
        },
      ],
    };
  }
}
