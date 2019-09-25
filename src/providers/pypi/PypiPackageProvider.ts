import PackageProvider from '../../core/PackageProvider';

export default class PypiPackageProvider extends PackageProvider {
  constructor() {
    super({ defaultRegistry: 'https://pypi.org/' });
  }

  get definition() {
    return {
      name: 'pypi',
      description: 'Manage pypi packages',
      children: [
        {
          name: 'publish',
          description: 'Publish pypi packages (wheels)',
          alias: 'p',
          loadChildren: {
            base: __dirname,
            dir: 'publish',
          },
        },
      ],
    };
  }
}
