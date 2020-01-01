import path from 'path';

import Command from '../../../core/Command';
import Cataloger from '../../../core/catalog/Cataloger';
import EntryInfo from '../../../core/catalog/EntryInfo';
import FileCatalogPersister from '../../../core/catalog/FileCatalogPersister';
import ArtifactoryPackageInfo from '../ArtifactoryPackageInfo';
import ArtifactoryPublisher, { ArtifactoryPublisherOptions, artifactoryPublisherOptions } from './ArtifactoryPublisher';

export type ArtifactoryPublishCatalogCommandOptions =
  ArtifactoryPublisherOptions
  & {
    catalog: string
  }

export default class ArtifactoryPublishCatalogCommand implements Command {
  get definition() {
    return {
      name: 'catalog',
      flags: '<catalog> <server> <repo> <packageType>',
      description: 'use the artifactory api to publish packages listed in the specified catalog to the registry',
      options: [
        ...artifactoryPublisherOptions
      ],
    };
  }

  async execute(options: ArtifactoryPublishCatalogCommandOptions) {
    const { catalog, logger } = options;
    const cataloger = new Cataloger({ ...options, mode: 'memory' });
    const filePersister = new FileCatalogPersister({ catalogFile: catalog, logger }, cataloger.persister);
    await cataloger.initialize(filePersister);

    const publisher = new ArtifactoryPublisher({
      ...options,
      // collectPackages: async () => await this.collectFromCatalog(options),
      collectPackages: this.collectPackagesFromCatalog,
      cataloger,
    });
    await publisher.publish();
  }

  * collectPackagesFromCatalog(options: { cataloger: Cataloger }): Iterable<ArtifactoryPackageInfo> {
    const transformer = (entry: EntryInfo): ArtifactoryPackageInfo => {
      const { name: packageName, version: filePath } = entry;

      const directory = path.dirname(filePath);
      const architecture = path.basename(directory);

      const packageInfo = {
        fileName: packageName,
        packageName,
        filePath,
        architecture,
      };
      return packageInfo;
    };

    const results = options.cataloger.stream<ArtifactoryPackageInfo>(transformer);
    return yield* results;
  }
}