const { collectPackagesByPath } = require('./collector');

class Publisher {
  constructor(options) {
    this.options = options;
  }

  async collectAndPublishPackages(options) {
    const errors = [];

    for (const packageInfo of await collectPackagesByPath({
      ...options,
      getPackageFileInfo: this.getPackageFileInfo,
    })) {
      try {
        await this.publishPackage({ ...packageInfo, ...options });
      }
      catch (error) {
        const message = error && error.message ? error.message : error;
        errors.push(`[${packageInfo.index}] [${'error'.red}] ${packageInfo.packagesPath} ${message}`);
      }
    }

    if (errors.length > 0) {
      this.printErrors(errors);
      process.exit(1);
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

module.exports = Publisher;
