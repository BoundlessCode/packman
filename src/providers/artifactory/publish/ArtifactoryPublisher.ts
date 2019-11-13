import path from 'path';
import { URL } from 'url';
import FormData from 'form-data';
import { createReadStream } from 'graceful-fs';

import calculateChecksums from '../../../core/crypto/calculateChecksums';
import { fetch, Headers } from '../../../core/fetcher';
import { normalizeRootedDirectory } from '../../../core/shell';
import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import ArtifactoryPackageInfo from '../ArtifactoryPackageInfo';

const PACKAGE_EXTENSION = 'tar.bz2';

type ArtifactoryPublisherOptions =
  PublisherOptions
  & {
    packagesPath: string
    server: string
    repo: string
    api?: string
    apiKey?: string
    byChecksum?: boolean
  }

export default class ArtifactoryPublisher extends Publisher<ArtifactoryPublisherOptions, ArtifactoryPackageInfo> {
  constructor(options: ArtifactoryPublisherOptions) {
    super(options);
  }

  async initializeOptions(options: ArtifactoryPublisherOptions): Promise<any> {
    const { logger, server, repo, packagesPath } = options;

    const rootPath = normalizeRootedDirectory(packagesPath, { logger });
    logger.info(`root path: ${rootPath.green}`);

    const api = new URL(`${repo}/`, server.endsWith('/') ? server : `${server}/`);
    logger.info(`api: ${api.href.green}`);

    return {
      rootPath,
      api,
      extension: `.${PACKAGE_EXTENSION}`,
    };
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions): ArtifactoryPackageInfo | undefined {
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
        fileName,
      };
    }
  }

  async publishPackage(packageInfo: ArtifactoryPackageInfo, options: ArtifactoryPublisherOptions) {
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

  async executePublishCommand(packageInfo: ArtifactoryPackageInfo, options: ArtifactoryPublisherOptions) {
    const { filePath, fileName, architecture } = packageInfo;
    const { api, apiKey, byChecksum, lenientSsl, logger } = options;

    if(!filePath) {
      throw new Error(`filePath is missing, cannot publish package`);
    }

    if(!architecture) {
      throw new Error(`architecture is missing, cannot publish package`);
    }

    // const registry = packageInfo.registry || options.registry;
    // logger.info(`registry: ${registry.green}`);
    const publishUrl = new URL(`${architecture}/${fileName}`, api);
    logger.info(`publishing ${filePath} to ${publishUrl.href}`);

    let headers: Headers | undefined = undefined;
    if(apiKey) {
      headers = headers || new Map<string, any>();
      headers.set('X-JFrog-Art-Api', apiKey);
    }

    if(byChecksum) {
      headers = headers || new Map<string, any>();
      const checksums = await calculateChecksums(filePath, ['sha256', 'sha1', 'md5']);
      headers.set('X-Checksum-Deploy', 'true');
      headers.set('X-Checksum-Sha1', checksums.sha1 as string);
      headers.set('X-Checksum-Sha256', checksums.sha256 as string);
      headers.set('X-Checksum', checksums.md5 as string);
    }

    const file = createReadStream(filePath);
    const formData = new FormData();
    formData.append('file', file);

    await fetch({
      method: 'PUT',
      uri: publishUrl,
      formData,
      contentType: 'multipart/form-data',
      lenientSsl,
      headers,
      logger,
    });
  }
}
