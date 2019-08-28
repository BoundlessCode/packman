import path from 'path';

import { execute, normalizeRootedDirectory } from '../../../core/shell';
import { getCurrentRegistry, getScopedPackageName } from '../npm-utils';
import PackageInfo from '../../../core/PackageInfo';
import { packageVersionExists, updateDistTagToLatest } from './npm-publish-utils';
import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';

const TARBALL_EXTENSION = 'tgz';

type NpmPublisherOptions = PublisherOptions & {
  packagesPath: string
  registry: string
  distTag: boolean
  lenientSsl: boolean
}

export default class NpmPublisher extends Publisher<NpmPublisherOptions> {
  constructor(options: NpmPublisherOptions) {
    super(options);
  }

  async publish() {
    const options = {
      ...this.options,
      ...await this.initialize(this.options),
    };
    await this.collectAndPublishPackages(options);
  }

  async executePublishCommand({ filePath, registry }: { filePath?: string, registry?: string }) {
    const targetRegistry = registry || this.options.registry;
    const { logger } = this.options;
    await execute(`npm publish ${filePath} --quiet --registry ${targetRegistry}`, { stdio: [0, 1, 2], logger });
  }

  async initialize(options) {
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

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions) {
    const fileInfo = path.parse(filePath);

    if (fileInfo.ext === extension) {
      counter.increment();

      const directoryPath = fileInfo.dir;
      const directoryParts = directoryPath.split(path.posix.sep);

      const packageName = directoryParts.pop();

      const potentialScope = directoryParts.pop() || '';
      const packageScope = potentialScope.startsWith('@') ? potentialScope : undefined;

      const fileName = fileInfo.name;
      const packageVersion = fileName.slice(fileName.lastIndexOf('-') + 1);

      return {
        index: counter.current,
        directoryPath,
        filePath,
        packageName,
        packageVersion,
        packageScope,
      };
    }
  }

  async publishPackage(packageInfo: PackageInfo) {
    const { registry: packageRegistry, index, directoryPath, packageName, packageVersion } = packageInfo;
    const { lenientSsl, distTag, registry, logger } = this.options;

    const scopedPackageName = getScopedPackageName(packageInfo);
    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${scopedPackageName} ${packageVersion}`;

    if (await packageVersionExists(packageInfo, { lenientSsl, logger })) {
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
}
