const path = require('path');

const { normalizeRootedDirectory } = require('../../core/shell');
const { getCurrentRegistry } = require('../npm-utils');
const { getScopedPackageName, packageVersionExists, updateDistTagToLatest } = require('./npm-publish-utils');
const { execute } = require('../../core/shell');
const Publisher = require('../../core/Publisher');
const { collectPackagesByPath } = require('../../core/collector');

const TARBALL_EXTENSION = 'tgz';

class NpmPublisher extends Publisher {
  constructor(options) {
    super(options);
  }

  async publish() {
    const data = await this.initialize();

    this.prepare();

    try {
      await this.publishPackages(data);
    }
    catch (error) {
      this.printErrors(error);
      process.exit(1);
    }
  }

  async executePublishCommand({ packagePath, registry }) {
    const targetRegistry = registry || this.options.registry;
    const { logger } = this.options;
    await execute(`npm publish ${packagePath} --quiet --registry ${targetRegistry}`, { stdio: [0, 1, 2], logger });
  }

  async initialize() {
    const { options } = this;
    const { logger, packagesPath } = options;

    const rootPath = normalizeRootedDirectory(packagesPath);
    logger.info(`root path: ${rootPath.green}`);

    const registry = await getCurrentRegistry({ logger });
    logger.info(`registry: ${registry.green}`);

    return {
      ...options,
      rootPath,
      packagesPath: rootPackagesPath,
      registry,
    };
  }

  async publishPackages(data) {
    const errors = [];
    const extension = `.${TARBALL_EXTENSION}`;
    for (const packageInfo of await collectPackagesByPath(data, this.getPackageFileInfo, this.options.logger, extension)) {
      try {
        await this.publishPackage(packageInfo);
      }
      catch (error) {
        const message = error && error.message ? error.message : error;
        errors.push(`[${packageInfo.index}] [${'error'.red}] ${packageInfo.packagesPath} ${message}`);
      }
    }
    if (errors.length > 0) {
      throw errors;
    }
  }

  getPackageFileInfo(data, counter, extension) {
    const { filePath } = data;
    const fileName = path.basename(filePath, extension);
    const separatorIndex = fileName.lastIndexOf('-');

    if (path.extname(filePath) === extension) {
      counter.increment();
      return {
        ...data,
        index: counter.current,
        directoryPath: path.dirname(filePath),
        packagePath: filePath, // path.join(packagesPath, packageFile),
        packageName: fileName.slice(0, separatorIndex),
        packageVersion: fileName.slice(separatorIndex + 1),
      };
    }
  }

  async publishPackage(packageInfo) {
    const { registry, index, directoryPath, packageName, packageVersion } = packageInfo;
    const { options } = this;
    const { logger } = options;

    const scopedPackageName = getScopedPackageName(packageInfo);
    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${scopedPackageName} ${packageVersion}`;

    if (await packageVersionExists(packageInfo, logger)) {
      logger.info(infoMessageFormat, 'exists'.yellow);
      return;
    }

    logger.debug(debugMessageFormat, 'publishing'.cyan);
    await this.executePublishCommand(packageInfo);
    logger.info(infoMessageFormat, 'published'.green);

    // we only support updating the dist-tag when the package comes from the target registry
    if (this.distTag && options.registry === packageInfo.registry) {
      logger.debug(debugMessageFormat, 'updating dist-tag'.cyan);
      await updateDistTagToLatest(registry, packageName, logger);
      logger.info(infoMessageFormat, 'updated dist-tag'.green);
    }
  }
}

module.exports = NpmPublisher;
