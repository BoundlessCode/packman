const pino = require('pino');

const logger = pino({
  prettyPrint: true,
  level: 'debug',
});

logger.debug(`logger initialized, level: ${logger.level}`);

module.exports = {
  logger,
};
