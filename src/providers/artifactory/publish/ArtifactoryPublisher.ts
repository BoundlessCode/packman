import path from 'path';
import { createReadStream } from 'fs';

import { fetch } from '../../../core/fetcher';
import { normalizeRootedDirectory } from '../../../core/shell';
import PackageInfo from '../../../core/PackageInfo';
import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import { URL } from 'url';

const PACKAGE_EXTENSION = 'tar.bz2';

type ArtifactoryPublisherOptions = PublisherOptions & {
  packagesPath: string
  server: string
  repo: string
  packageType: string
  lenientSsl: boolean
  api?: string
}

export default class ArtifactoryPublisher extends Publisher<ArtifactoryPublisherOptions> {
  constructor(options: ArtifactoryPublisherOptions) {
    super(options);
  }

  async publish() {
    const options = {
      ...this.options,
      ...await this.initialize(this.options),
    };
    await this.collectAndPublishPackages(options);
  }

  async executePublishCommand(packageInfo: PackageInfo, options: ArtifactoryPublisherOptions) {
    const { filePath, architecture } = packageInfo;
    const { api, logger } = options;
    
    if(!filePath) {
      throw new Error(`filePath is missing, cannot publish package`);
    }

    if(!architecture) {
      throw new Error(`architecture is missing, cannot publish package`);
    }

    // const registry = packageInfo.registry || options.registry;
    // logger.info(`registry: ${registry.green}`);

    const publishUrl = new URL(architecture, api);
    // logger.info(`publishing... ${publishUrl.href} ${filePath}`);
    await fetch({
      method: 'PUT',
      uri: publishUrl,
      formData: {
        file: createReadStream(filePath),
      },
      contentType: 'multipart/form-data',
      logger,
    });
  }

  async initialize(options) {
    const { logger, server, repo, packageType, packagesPath } = options;

    const rootPath = normalizeRootedDirectory(packagesPath, { logger });
    logger.info(`root path: ${rootPath.green}`);

    const api = new URL(`api/${packageType}/${repo}`, server);
    logger.info(`api: ${api.href.green}`);

    return {
      rootPath,
      api,
      extension: `.${PACKAGE_EXTENSION}`,
    };
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions) {
    const fileInfo = path.parse(filePath);
    const { base: fileName, dir: directoryPath } = fileInfo;

    if (fileName.endsWith(extension)) {
      counter.increment();
      
      const packageName = fileName.substring(0, fileName.lastIndexOf(extension));

      const directoryParts = directoryPath.split(path.posix.sep);
      const architecture = directoryParts.pop();

      return {
        index: counter.current,
        directoryPath,
        filePath,
        packageName,
        architecture,
      };
    }
  }

  async publishPackage(packageInfo: PackageInfo, options: ArtifactoryPublisherOptions) {
    const { index, directoryPath, packageName, architecture } = packageInfo;
    const { logger } = options;

    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${packageName} ${architecture}`;

    // if (await packageVersionExists(packageInfo, { lenientSsl, logger })) {
    //   logger.info(infoMessageFormat, 'exists'.yellow);
    //   return;
    // }

    logger.info(debugMessageFormat, 'publishing'.cyan);
    await this.executePublishCommand(packageInfo, options);
    logger.info(infoMessageFormat, 'published'.green);
  }
}