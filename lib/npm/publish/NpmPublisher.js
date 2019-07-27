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

  async prepare() { }

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
    registry = registry || this.options.registry;
    const { logger } = this.options;
    await execute(`npm publish ${packagePath} --quiet --registry ${registry}`, { stdio: [0, 1, 2], logger });
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
        packagesPath: path.dirname(filePath),
        packagePath: filePath, // path.join(packagesPath, packageFile),
        packageName: fileName.slice(0, separatorIndex),
        packageVersion: fileName.slice(separatorIndex + 1),
      };
    }
  }

  async publishPackage(packageInfo) {
    const { registry, index, packagePath, packageName, packageVersion } = packageInfo;
    const { options } = this;
    const { logger } = options;

    const scopedPackageName = getScopedPackageName(packageInfo);

    if (await packageVersionExists(packageInfo, logger)) {
      logger.info('publish', `[${index}] [${'exists'.yellow}] ${scopedPackageName} ${packageVersion}`);
      return;
    }

    logger.debug('publish', `[${index}] [${'publishing'.cyan}] ${packagePath} ...`);
    await this.executePublishCommand(packageInfo);
    logger.info('publish', `[${index}] [${'published'.green}] ${scopedPackageName} ${packageVersion}`);

    // we only support updating the dist-tag when the package comes from the target registry
    if (this.distTag && options.registry === packageInfo.registry) {
      logger.debug('publish', `[${index}] [${'updating dist-tag'.cyan}] ${packagePath} ...`);
      await updateDistTagToLatest(registry, packageName, logger);
      logger.info('publish', `[${index}] [${'updated dist-tag'.green}] ${scopedPackageName} ${packageVersion}`);
    }
  }

  printErrors(error = []) {
    const { logger } = this.options;
    const errors =
      error instanceof Array
        ? error
        : [JSON.stringify(error), error.message || error];

    errors.forEach(error => logger.error(error));
  }
}

module.exports = NpmPublisher;
