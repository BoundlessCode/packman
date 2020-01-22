import path from 'path';

import { execute, normalizeRootedDirectory } from '../../../core/shell';
import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import { WHEEL_EXTENSION, getPackageFileInfo } from '../pypi-utils';
import PypiPackageInfo from '../PypiPackageInfo';

type PypiPublisherOptions =
  PublisherOptions
  & {
    packagesPath: string
    registry?: string
    lenientSsl?: boolean
  }

export default class PypiPublisher extends Publisher<PypiPublisherOptions, PypiPackageInfo> {
  constructor(options: PypiPublisherOptions) {
    super(options);
  }

  async initializeOptions(options: PypiPublisherOptions) {
    const { logger, packagesPath } = options;

    const rootPath = normalizeRootedDirectory(packagesPath, { logger });
    logger.info(`root path: ${rootPath.green}`);

    const registry = options.registry;
    logger.info(`registry: ${(registry || '<unspecified>').green}`);

    return {
      rootPath,
      registry,
      extension: `.${WHEEL_EXTENSION}`,
    };
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions): PypiPackageInfo | undefined {
    const packageInfo = getPackageFileInfo({ filePath, extension });

    if (packageInfo) {
      counter.increment();

      return {
        ...packageInfo,
        index: counter.current,
      };
    }
  }

  async publishPackage(packageInfo: PypiPackageInfo, options: PypiPublisherOptions) {
    const { registry: packageRegistry, index, directoryPath, packageVersion } = packageInfo;
    const { registry: optionsRegistry, logger } = options;


    const fullPackageInfo = {
      ...packageInfo,
      registry: packageRegistry || optionsRegistry,
    };

    const packageName = fullPackageInfo.filePath;
    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${packageName} ${packageVersion}`;

    // if (await packageVersionExists(fullPackageInfo, options)) {
    //   logger.info(infoMessageFormat, 'exists'.yellow);
    //   return;
    // }

    logger.info(debugMessageFormat, 'publishing'.cyan);
    await this.executePublishCommand(fullPackageInfo, options);
    logger.info(infoMessageFormat, 'published'.green);
  }

  async executePublishCommand({ filePath, registry }: { filePath?: string, registry?: string }, options: PypiPublisherOptions) {
    const target = registry || options.registry;
    const { logger } = options;
    await execute(`twine upload --repository-url ${target} --skip-existing "${filePath}"`, { stdio: [0, 1, 2], logger });
  }
}
