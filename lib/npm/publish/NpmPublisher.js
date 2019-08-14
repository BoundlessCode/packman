const path = require('path');

const { normalizeRootedDirectory } = require('../../core/shell');
const { getCurrentRegistry, getScopedPackageName } = require('../npm-utils');
const { packageVersionExists, updateDistTagToLatest } = require('./npm-publish-utils');
const { execute } = require('../../core/shell');
const Publisher = require('../../core/Publisher');

const TARBALL_EXTENSION = 'tgz';

class NpmPublisher extends Publisher {
  constructor(options) {
    super(options);
  }

  async publish() {
    const options = {
      ...this.options,
      ...await this.initialize(this.options),
    };
    await this.collectAndPublishPackages(options);
  }

  async executePublishCommand({ filePath, registry }) {
    const targetRegistry = registry || this.options.registry;
    const { logger } = this.options;
    await execute(`npm publish ${filePath} --quiet --registry ${targetRegistry}`, { stdio: [0, 1, 2], logger });
  }

  async initialize(options) {
    const { logger, packagesPath } = options;

    const rootPath = normalizeRootedDirectory(packagesPath);
    logger.info(`root path: ${rootPath.green}`);

    const registry = options.registry || await getCurrentRegistry({ logger });
    logger.info(`registry: ${registry.green}`);

    return {
      rootPath,
      registry,
      extension: `.${TARBALL_EXTENSION}`,
    };
  }

  getPackageFileInfo({ filePath, extension, counter }) {
    const fileInfo = path.parse(filePath);

    if (fileInfo.ext === extension) {
      counter.increment();
      
      const directoryPath = fileInfo.dir;
      const directoryParts = directoryPath.split(path.posix.sep);

      const packageName = directoryParts.pop();

      const potentialScope = directoryParts.pop();
      const packageScope = potentialScope.startsWith('@') ? potentialScope : undefined;

      const fileName = fileInfo.name;
      const packageVersion = fileName.slice(fileName.lastIndexOf('-') + 1);

      return {
        index: counter.current,
        directoryPath,
        filePath,
        packageName,
        packageVersion,
        packageScope,
      };
    }
  }

  async publishPackage(packageInfo) {
    const { registry, index, directoryPath, packageName, packageVersion } = packageInfo;
    const { options } = this;
    const { lenientSsl, logger } = options;

    const scopedPackageName = getScopedPackageName(packageInfo);
    const baseMessageFormat = `publish [${index}] [%s]`;
    const debugMessageFormat = `${baseMessageFormat} ${directoryPath} ...`;
    const infoMessageFormat = `${baseMessageFormat} ${scopedPackageName} ${packageVersion}`;

    if (await packageVersionExists(packageInfo, { lenientSsl, logger })) {
      logger.info(infoMessageFormat, 'exists'.yellow);
      return;
    }

    logger.info(debugMessageFormat, 'publishing'.cyan);
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
