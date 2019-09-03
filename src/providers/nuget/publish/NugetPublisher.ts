import fs from 'fs';
import path from 'path';
import glob from 'glob';

import { execute, normalizeRootedDirectory } from '../../../core/shell';
import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import NugetPackageProvider from '../NugetPackageProvider';
import NugetPackageInfo from '../NugetPackageInfo';

const NUPKG_EXTENSION = 'nupkg';

export type NugetPublisherOptions = PublisherOptions & {
  registry: string
  packagesPath: string
}

export default class NugetPublisher extends Publisher<NugetPublisherOptions, NugetPackageInfo> {
  private provider: NugetPackageProvider = new NugetPackageProvider();

  constructor(options: NugetPublisherOptions) {
    super(options);
  }

  async initializeOptions(options: NugetPublisherOptions) {
    const { logger, packagesPath, registry } = options;

    const rootPath = normalizeRootedDirectory(packagesPath, { logger });
    logger.info(`root path: ${rootPath.green}`);

    const providerRegistry = await this.provider.getRegistry({
      registry,
    });
    logger.info(`registry: ${providerRegistry.green}`);

    let filePath: string | undefined;
    if (glob.hasMagic(packagesPath)) {
      filePath = packagesPath;
    }
    else if (fs.lstatSync(packagesPath).isDirectory()) {
      filePath = `${packagesPath}${path.sep}**${path.sep}*.${NUPKG_EXTENSION}`;
    }

    const alternatePublish =
      filePath
        ? this.executePublishCommand
        : undefined;

    return {
      rootPath,
      registry: providerRegistry,
      extension: `.${NUPKG_EXTENSION}`,
      alternatePublish,
      filePath,
    }
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions): NugetPackageInfo | undefined {
    const fileName = path.basename(filePath, extension);
    const pattern = /\.([^\.]+\.[^\.]+\.[^\.]+)\.nupkg/;
    const matches = fileName.match(pattern);
    const packageVersion = matches && matches.length > 0 ? matches[1] : '';
    const separatorIndex = fileName.indexOf(packageVersion);
    const packageName = fileName.slice(0, separatorIndex);

    if (path.extname(filePath) === extension) {
      counter.increment();
      return {
        index: counter.current,
        directoryPath: path.dirname(filePath),
        filePath,
        packageName,
        packageVersion,
      };
    }
  }

  async publishPackage(packageInfo: NugetPackageInfo, options: NugetPublisherOptions) {
    const { index, directoryPath, packageName, packageVersion } = packageInfo;
    const { logger } = options;

    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${packageName} ${packageVersion}`;

    logger.debug(debugMessageFormat, 'publishing'.cyan);
    await this.executePublishCommand(packageInfo);
    logger.info(infoMessageFormat, 'published'.green);
  }

  async executePublishCommand({ filePath, registry }: { filePath?: string, registry?: string }) {
    const targetRegistry = registry || this.options.registry;
    const { logger } = this.options;
    await execute(`dotnet nuget push ${filePath} -s ${targetRegistry}`, { stdio: [0, 1, 2], logger });
  }
}
