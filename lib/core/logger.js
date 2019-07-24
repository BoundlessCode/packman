const pino = require('pino');

const logger = pino({
  prettyPrint: true,
  level: 'debug',
});

log([], 'logger initialized');

console.log(`levels: ${logger.level}`);

function log(metaValues = [], ...details) {
  if (log.ignore) return;

  const meta = metaValues.reduce((memo, value) => `${memo}[${value}]`, '');
  logger.info(meta, ...details);
}

log.ignore = false;

module.exports = {
  log,
};
