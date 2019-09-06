import Command from '../../../core/Command';
import { GlobalOptions, globalOptions, catalogOption, CatalogFileOption } from '../../../core/commandOptions';
import { normalizeRootedDirectory } from '../../../core/shell';
import Cataloger from '../../../core/catalog/Cataloger';
import { TARBALL_EXTENSION } from '../npm-utils';
import NpmPublisher from '../publish/NpmPublisher';

export type NpmCatalogTarballsCommandOptions =
  CatalogFileOption
  & GlobalOptions
  & {
    packagesPath: string
    distTag: boolean
  }

export default class NpmCatalogTarballsCommand implements Command {
  get definition() {
    return {
      name: 'tarballs',
      flags: '<catalogFile> <packagesPath>',
      description: 'create a catalog of tarballs (.tgz files) in the specified directory',
      options: [
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmCatalogTarballsCommandOptions) {
    const { packagesPath, logger } = options;

    const rootPath = normalizeRootedDirectory(packagesPath, options);
    logger.info(`root path: ${rootPath.green}`);

    const cataloger = new Cataloger({ ...options, logActionsAsInfo: true });
    await cataloger.initialize();
    const publisher = new NpmPublisher(options);

    const packages = publisher.collectPackagesByPath({ ...options, rootPath, extension: TARBALL_EXTENSION });

    for (const { packageName: name, packageVersion: version = '' } of packages) {
      logger.debug(`found package ${name}@${version}, cataloging`);
      await cataloger.catalog({ name, version });
    }
  }
}
