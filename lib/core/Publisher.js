class Publisher {
  constructor(options) {
    this.options = options;
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
