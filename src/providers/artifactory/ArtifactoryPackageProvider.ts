import PackageProvider from '../../core/PackageProvider';

export default class ArtifactoryPackageProvider extends PackageProvider {
  constructor() {
    super();
  }

  get definition() {
    return {
      name: 'artifactory',
      description: 'Work directly with the Artifactory API',
      alias: 'a',
      children: [
        {
          name: 'publish',
          description: 'Publish packages',
          alias: 'p',
          loadChildren: {
            base: __dirname,
            dir: 'publish',
          },
        },
        {
          name: 'delete',
          description: 'Delete packages',
          alias: 'd',
          loadChildren: {
            base: __dirname,
            dir: 'delete',
          },
        },
      ],
    };
  }
}
