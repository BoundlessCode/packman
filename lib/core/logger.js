const pino = require('pino');
const prettifier = require('@boco/pino-pretty');

const processLevel = require('./log-processors/processLevel');

const processors = [
  processLevel,
  'semicolon',
  'message',
  'eol',
  'error',
  'object'
];

const logger = pino({
  prettyPrint: {
    processors,
    skipObjectKeys: ['command'],
  },
  level: 'info',
  prettifier
});

logger.debug(`logger initialized, level: ${logger.level}`);

module.exports = {
  logger,
};
