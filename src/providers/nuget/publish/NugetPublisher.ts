import fs from 'fs';
import path from 'path';
import glob from 'glob';

import { execute, normalizeRootedDirectory } from '../../../core/shell';
import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import NugetPackageProvider from '../NugetPackageProvider';
import PackageInfo from '../../../core/PackageInfo';

const NUPKG_EXTENSION = 'nupkg';

export type NugetPublisherOptions = PublisherOptions & {
  registry: string
  packagesPath: string
}

export default class NugetPublisher extends Publisher<NugetPublisherOptions> {
  private provider: NugetPackageProvider;

  constructor(options: NugetPublisherOptions) {
    super(options);
    this.provider = new NugetPackageProvider();
  }

  async publish() {
    const options = {
      ...this.options,
      ...await this.initialize(this.options),
    };

    const { registry, packagesPath } = options;

    const isGlob = glob.hasMagic(packagesPath);
    if (isGlob) {
      await this.executePublishCommand({ filePath: packagesPath, registry });
    }
    else if (fs.lstatSync(packagesPath).isDirectory()) {
      const filePath = `${packagesPath}${path.sep}**${path.sep}*.${NUPKG_EXTENSION}`;
      await this.executePublishCommand({ filePath, registry });
    }
    else {
      await this.collectAndPublishPackages(options);
    }
  }

  async initialize(options) {
    const { logger, packagesPath, registry } = options;

    const rootPath = normalizeRootedDirectory(packagesPath, { logger });
    logger.info(`root path: ${rootPath.green}`);

    const providerRegistry = await this.provider.getRegistry({
      registry,
    });
    logger.info(`registry: ${providerRegistry.green}`);

    return {
      rootPath,
      registry: providerRegistry,
      extension: `.${NUPKG_EXTENSION}`,
    }
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions) {
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

  async publishPackage(packageInfo: PackageInfo) {
    const { index, directoryPath, packageName, packageVersion } = packageInfo;
    const { options } = this;
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
