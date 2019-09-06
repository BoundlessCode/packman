import path from 'path';

import { execute, normalizeRootedDirectory } from '../../../core/shell';
import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import { getCurrentRegistry, getScopedPackageName, packageVersionExists, TARBALL_EXTENSION, getPackageFileInfo } from '../npm-utils';
import NpmPackageInfo from '../NpmPackageInfo';
import { updateDistTagToLatest } from './npm-publish-utils';

type NpmPublisherOptions =
  PublisherOptions
  & {
    packagesPath: string
    registry?: string
    distTag: boolean
    lenientSsl?: boolean
  }

export default class NpmPublisher extends Publisher<NpmPublisherOptions, NpmPackageInfo> {
  constructor(options: NpmPublisherOptions) {
    super(options);
  }

  async initializeOptions(options: NpmPublisherOptions) {
    const { logger, packagesPath } = options;

    const rootPath = normalizeRootedDirectory(packagesPath, { logger });
    logger.info(`root path: ${rootPath.green}`);

    const registry = options.registry || await getCurrentRegistry({ logger });
    logger.info(`registry: ${registry.green}`);

    return {
      rootPath,
      registry,
      extension: `.${TARBALL_EXTENSION}`,
    };
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions): NpmPackageInfo | undefined {
    const packageInfo = getPackageFileInfo({ filePath, extension });

    if (packageInfo) {
      counter.increment();

      return {
        ...packageInfo,
        index: counter.current,
      };
    }
  }

  async publishPackage(packageInfo: NpmPackageInfo, options: NpmPublisherOptions) {
    const { registry: packageRegistry, index, directoryPath, packageName, packageVersion } = packageInfo;
    const { distTag, registry, logger } = options;

    const scopedPackageName = getScopedPackageName(packageInfo);
    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${scopedPackageName} ${packageVersion}`;

    if (await packageVersionExists(packageInfo, options)) {
      logger.info(infoMessageFormat, 'exists'.yellow);
      return;
    }

    logger.info(debugMessageFormat, 'publishing'.cyan);
    await this.executePublishCommand(packageInfo);
    logger.info(infoMessageFormat, 'published'.green);

    // we only support updating the dist-tag when the package comes from the target registry
    if (distTag && registry === packageInfo.registry) {
      logger.debug(debugMessageFormat, 'updating dist-tag'.cyan);
      await updateDistTagToLatest(packageRegistry as string, packageName, logger);
      logger.info(infoMessageFormat, 'updated dist-tag'.green);
    }
  }

  async executePublishCommand({ filePath, registry }: { filePath?: string, registry?: string }) {
    const target = registry || this.options.registry;
    const { logger } = this.options;
    await execute(`npm publish ${filePath} --quiet --registry ${target}`, { stdio: [0, 1, 2], logger });
  }
}
