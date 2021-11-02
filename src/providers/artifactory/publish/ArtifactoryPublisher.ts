import path from 'path';
import { URL } from 'url';
import { createReadStream } from 'graceful-fs';

import { TimeoutOption, GlobalOptions, globalOptions } from '../../../core/commandOptions';
import calculateChecksums from '../../../core/crypto/calculateChecksums';
import { Fetcher, Headers, URI } from '../../../core/fetcher';
import { normalizeRootedDirectory } from '../../../core/shell';
import Publisher, { PublisherOptions, publisherOptions, GetPackageFileInfoOptions, PackageVersionExistsOptions } from '../../../core/Publisher';
import ArtifactoryPackageInfo from '../ArtifactoryPackageInfo';

const PACKAGE_EXTENSION = 'tar.bz2';

export type ArtifactoryPublisherOptions =
  GlobalOptions
  & PublisherOptions
  & TimeoutOption
  & {
    packagesPath: string
    server: string
    packageType: string
    repo: string
    api?: string
    apiKey?: string
    byChecksum?: boolean
    force?: boolean
  }

export const artifactoryPublisherOptions = [
  // registryOption,
  {
    flags: '--api-key <apiKey>',
    description: 'your API Key, as specified on your user profile page in Artifactory',
  },
  {
    flags: '--by-checksum',
    description: 'calculate the sha256, sha1, and md5 checksums and use them to deploy to Artifactory'
  },
  {
    flags: '--force',
    description: 'publish packages even if they have already been published'
  },
  ...publisherOptions,
  ...globalOptions,
];

export default class ArtifactoryPublisher extends Publisher<ArtifactoryPublisherOptions, ArtifactoryPackageInfo> {
  constructor(options: ArtifactoryPublisherOptions) {
    super(options);
  }

  async initializeOptions(options: ArtifactoryPublisherOptions): Promise<any> {
    const { logger, server, repo, packagesPath } = options;

    const rootPath = packagesPath ? normalizeRootedDirectory(packagesPath, { logger }) : '';
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

    logger.info(debugMessageFormat, 'publishing'.cyan);
    await this.executePublishCommand(packageInfo, options);
    logger.info(infoMessageFormat, 'published'.green);
  }

  async packageVersionExists({ packageName, uri }: { packageName: string, uri: URI }, { timeout, lenientSsl = false, logger }: PackageVersionExistsOptions): Promise<boolean> {
    try {
      logger.debug(`checking packageVersionExists, lenientSsl: ${lenientSsl}, uri: ${uri}`);
      const fetcher = new Fetcher({
        lenientSsl,
      });
      const response = await fetcher.fetch({
        uri,
        responseType: 'json',
        timeout,
        logger,
      });

      return response.success;
    }
    catch (error: any) {
      const statusCode = error.statusCode || (error.response && error.response.status);
      if (statusCode === 404) {
        logger.debug(`the package ${packageName} could not be found at ${uri}`.yellow);
        return false;
      }
      logger.debug('package version exists error', { uri, error });
      throw error;
    }
  }

  async executePublishCommand(packageInfo: ArtifactoryPackageInfo, options: ArtifactoryPublisherOptions) {
    const { filePath, fileName, architecture } = packageInfo;
    const { api, apiKey, byChecksum, force, lenientSsl, timeout, logger } = options;

    if (!filePath) {
      throw new Error(`filePath is missing, cannot publish package`);
    }

    if (!architecture) {
      throw new Error(`architecture is missing, cannot publish package`);
    }

    const packageName = `${architecture}/${fileName}`;

    // const registry = packageInfo.registry || options.registry;
    // logger.info(`registry: ${registry.green}`);
    const publishUrl = new URL(packageName, api);
    logger.info(`publishing ${filePath} to ${publishUrl.href}`);

    if (!force && await this.packageVersionExists({ packageName, uri: publishUrl }, options)) {
      logger.info('[exists]'.yellow, `${packageName} at ${publishUrl}`);
      return;
    }

    let headers: Headers | undefined = undefined;
    if (apiKey) {
      headers = headers || new Map<string, any>();
      headers.set('X-JFrog-Art-Api', apiKey);
    }

    if (byChecksum) {
      headers = headers || new Map<string, any>();
      const checksums = await calculateChecksums(filePath, ['sha256', 'sha1', 'md5']);
      headers.set('X-Checksum-Deploy', 'true');
      headers.set('X-Checksum-Sha1', checksums.sha1 as string);
      headers.set('X-Checksum-Sha256', checksums.sha256 as string);
      headers.set('X-Checksum', checksums.md5 as string);
    }

    const file = createReadStream(filePath);

    const fetcher = new Fetcher({
      lenientSsl,
    });
    await fetcher.fetch({
      method: 'put',
      uri: publishUrl,
      data: file,
      contentType: 'application/octet-stream',
      headers,
      timeout,
      logger,
    });
  }
}
