const { resolve } = require('path');
const { once } = require('events');
const { appendFileSync, createReadStream, existsSync } = require('fs');
const { createInterface } = require('readline');

const SEPARATOR = ' ';
const DEFAULT_FILE_NAME = '.index.packman';

class Tracker {
    constructor({ indexFile, logger }) {
        this.entries = new Set();
        this.fullPath = resolve(indexFile || DEFAULT_FILE_NAME);
        this.logger = logger.child({ area: 'tracker' });
    }

    unique({ name, version }) {
        return `${name}${SEPARATOR}${version}`.toLowerCase();
    }

    async initialize() {
        const fullPath = this.fullPath;
        const entries = this.entries;
        const logger = this.logger.child({ method: 'initialize' });

        try {
            if (existsSync(fullPath)) {
                logger.info('loading', fullPath);
                const readline = createInterface({
                    input: createReadStream(fullPath),
                    crlfDelay: Infinity,
                });

                readline.on('line', (line) => {
                    entries.add(line);
                    logger.debug('loaded', line, 'to set');
                });

                await once(readline, 'close');

                logger.info('done');
            }
            else {
                logger.info('file does not exist:', fullPath);
            }
        }
        catch (error) {
            logger.error(error);
        }
    }

    async track(packageInfo) {
        const fullPath = this.fullPath;
        const entry = this.unique(packageInfo);
        const logger = this.logger.child({ method: 'track', entry });

        const entries = this.entries;
        if (entries.has(entry)) {
            logger.debug('exists in set');
        }
        else {
            entries.add(entry);
            logger.debug('added to set');
            try {
                appendFileSync(fullPath, entry + '\n', 'utf8');
                logger.debug('appended to', fullPath);
            }
            catch (error) {
                logger.error(error);
            }
        }
    }

    contains(packageInfo) {
        const entry = this.unique(packageInfo);
        const contains = this.entries.has(entry);
        const logger = this.logger.child({ method: 'contains' });

        logger.debug(contains ? 'package is tracked' : 'package is not tracked', packageInfo);
        return contains;
    }
}

module.exports = Tracker;
