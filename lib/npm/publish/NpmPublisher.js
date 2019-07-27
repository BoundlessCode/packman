const fs = require('fs');
const path = require('path');
const globby = require('globby');

const { getCurrentRegistry } = require('../npm-utils');
const { getScopedPackageName, packageVersionExists, updateDistTagToLatest, normalizeTgzsDirectory } = require('./npm-publish-utils');
const { execute } = require('../../core/shell');
const Publisher = require('../../core/Publisher');
const { createCounter } = require('../../core/counter');

const TARBALL_EXTENSION = 'tgz';

class NpmPublisher extends Publisher {
  constructor(options) {
    super(options);
  }

  async prepare() { }

  async publish() {
    const data = await this.initialize();

    this.prepare();

    const counter = createCounter();

    try {
      await this.publishPackages(data, counter);
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

    const rootPackagesPath = normalizeTgzsDirectory(packagesPath);
    logger.info(`root packages path: ${rootPackagesPath.green}`);

    const registry = await getCurrentRegistry({ logger });
    logger.info(`registry: ${registry.green}`);

    return {
      ...options,
      rootPackagesPath,
      packagesPath: rootPackagesPath,
      registry,
    };
  }

  async publishPackages(data, counter) {
    const errors = [];
    for (const packagePath of await this.collectPackagesByPath(data, counter)) {
      try {
        await this.publishPackage(packagePath);
      }
      catch (error) {
        const message = error && error.message ? error.message : error;
        errors.push(`[${packagePath.index}] [${'error'.red}] ${packagePath.packagesPath} ${message}`);
      }
    }
    if (errors.length > 0) {
      throw errors;
    }
  }

  * collectPackagesByPath(data, counter) {
    const { logger } = this.options;
    const { packagesPath } = data;

    const filePaths = this.collectFilePaths(packagesPath);

    for (const filePath of filePaths) {
      logger.debug('collecting', filePath);

      yield this.collectPackageFile({ ...data, filePath }, counter);
    }
  }

  collectFilePaths(packagesPath) {
    const { logger } = this.options;
    const stat = fs.lstatSync(packagesPath);

    const filePaths = [];
    if (stat.isFile()) {
      filePaths.push(packagesPath);
    }
    else {
      const extension = `.${TARBALL_EXTENSION}`;
      const glob = `${packagesPath}/**/*${extension}`;
      filePaths.push(...globby.sync(glob));
    }

    logger.debug('list of files to collect', filePaths);
    return filePaths;
  }

  collectPackageFile(data, counter) {
    const { filePath } = data;
    const extension = `.${TARBALL_EXTENSION}`;
    const fileName = path.basename(filePath, extension);
    const separatorIndex = fileName.lastIndexOf('-');

    if (path.extname(filePath) === extension) {
      counter.increment();
      return {
        ...data,
        index: counter.current,
        packagesPath: path.dirname(filePath),
        packagePath: filePath, // path.join(packagesPath, packageFile),
        name: fileName.slice(0, separatorIndex),
        version: fileName.slice(separatorIndex + 1),
      };
    }
  }

  async publishPackage(packageInfo) {
    const { registry, index, packagePath, name, version } = packageInfo;
    const { options } = this;
    const { logger } = options;

    const scopedPackageName = getScopedPackageName(packageInfo);

    if (await packageVersionExists(packageInfo, logger)) {
      logger.info('publish', `[${index}] [${'exists'.yellow}] ${scopedPackageName} ${version}`);
      return;
    }

    logger.debug('publish', `[${index}] [${'publishing'.cyan}] ${packagePath} ...`);
    await this.executePublishCommand(packageInfo);
    logger.info('publish', `[${index}] [${'published'.green}] ${scopedPackageName} ${version}`);

    // we only support updating the dist-tag when the package comes from the target registry
    if (this.distTag && options.registry === packageInfo.registry) {
      logger.debug('publish', `[${index}] [${'updating dist-tag'.cyan}] ${packagePath} ...`);
      await updateDistTagToLatest(registry, name, logger);
      logger.info('publish', `[${index}] [${'updated dist-tag'.green}] ${scopedPackageName} ${version}`);
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
