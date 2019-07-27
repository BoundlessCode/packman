const fs = require('fs');
const path = require('path');
const globby = require('globby');

const { execute, normalizeRootedDirectory } = require('../../core/shell');
const Publisher = require('../../core/Publisher');
const NugetPackageProvider = require('../NugetPackageProvider');

const NUPKG_EXTENSION = 'nupkg';

class NugetPublisher extends Publisher {
  constructor(options) {
    super(options);
    this.provider = new NugetPackageProvider();
  }

  async publish() {
    const options = {
      ...this.options,
      ...await this.initialize(this.options),
    };

    const { registry, packagesPath } = options;

    const isGlob = globby.hasMagic(packagesPath);
    if (isGlob) {
      await this.executePublishCommand({ filePath: packagePath, registry });
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
    const { logger, packagesPath } = options;

    const rootPath = normalizeRootedDirectory(packagesPath);
    logger.info(`root path: ${rootPath.green}`);

    const registry = await this.provider.getRegistry({
      registry: this.options.registry,
    });
    logger.info(`registry: ${registry.green}`);

    return {
      rootPath,
      registry,
      extension: `.${NUPKG_EXTENSION}`,
    }
  }

  getPackageFileInfo({ filePath, extension, counter }) {
    const fileName = path.basename(filePath, extension);
    const packageVersion = fileName.match(/\.([^\.]+\.[^\.]+\.[^\.]+)\.nupkg/)[1];
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

  async publishPackage(packageInfo) {
    const { registry, index, directoryPath, packageName, packageVersion } = packageInfo;
    const { options } = this;
    const { logger } = options;

    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${packageName} ${packageVersion}`;

    logger.debug(debugMessageFormat, 'publishing'.cyan);
    await this.executePublishCommand(packageInfo);
    logger.info(infoMessageFormat, 'published'.green);
  }

  async executePublishCommand({ filePath, registry }) {
    const targetRegistry = registry || this.options.registry;
    const { logger } = this.options;
    await execute(`dotnet nuget push ${filePath} -s ${targetRegistry}`, { stdio: [0, 1, 2], logger });
  }
}

module.exports = NugetPublisher;
