import PackageProvider from '../../core/PackageProvider';

export default class WatchPackageProvider extends PackageProvider {
  constructor() {
    super();
  }

  get definition() {
    return {
      name: 'watch',
      description: 'Watch the file system',
      children: [
        {
          name: 'bundles',
          description: 'Watch bundles',
          alias: 'b',
          loadChildren: {
            base: __dirname,
            dir: 'bundles',
          },
        },
      ],
    };
  }
}
