const { resolve } = require('path');
const { once } = require('events');
const { appendFileSync, createReadStream, existsSync } = require('fs');
const { createInterface } = require('readline');

const SEPARATOR = ' ';
const DEFAULT_FILE_NAME = '.index.packman';

class Cataloger {
    constructor({ indexFile, logger, logActionsAsInfo = false }) {
        this.entries = new Set();
        this.fullPath = resolve(indexFile || DEFAULT_FILE_NAME);
        this.logger = logger.child({ area: 'cataloger' });
        this.logActionsAsInfo = logActionsAsInfo;
    }

    unique({ name, version }) {
        return `${name}${SEPARATOR}${version}`.toLowerCase();
    }

    parse(entry) {
        const [name, version] = entry.split(SEPARATOR);
        return { name, version };
    }

    async initialize() {
        const fullPath = this.fullPath;
        const entries = this.entries;
        const logger = this.logger.child({ method: 'initialize' });

        try {
            if (this.exists()) {
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

                logger.info('cataloger initialized');
            }
            else {
                logger.info('file does not yet exist:', fullPath);
            }
        }
        catch (error) {
            logger.error(error);
        }
    }

    async catalog(packageInfo) {
        const fullPath = this.fullPath;
        const entry = this.unique(packageInfo);
        const logger = this.logger.child({ method: 'catalog', entry });
        const log = (this.logActionsAsInfo ? logger.info : logger.debug).bind(logger);

        const entries = this.entries;
        if (entries.has(entry)) {
            log(`${entry} is already in the set`.yellow);
        }
        else {
            entries.add(entry);
            log(`${entry} was added to the set`.green);
            try {
                appendFileSync(fullPath, entry + '\n', 'utf8');
                logger.debug('appended to', fullPath);
            }
            catch (error) {
                logger.error(error);
            }
        }
    }

    * stream(map) {
        map = map || (value => value);
        for (const entry of this.entries.values()) {
            const parsed = this.parse(entry);
            const mapped = map(parsed);
            yield mapped;
        }
    }

    contains(packageInfo) {
        const entry = this.unique(packageInfo);
        const contains = this.entries.has(entry);
        const logger = this.logger.child({ method: 'contains' });

        logger.debug(contains ? 'the package is in the catalog' : 'the package is not in the catalog', packageInfo);
        return contains;
    }

    exists() {
        return existsSync(this.fullPath);
    }
}

module.exports = Cataloger;
