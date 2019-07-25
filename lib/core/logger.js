const pino = require('pino');

const logger = pino({
  prettyPrint: true,
  level: 'info',
});

logger.debug(`logger initialized, level: ${logger.level}`);

module.exports = {
  logger,
};
