import { Logger } from '../logger';
import CatalogPersister from './CatalogPersister';
import { FileCatalogPersister } from './FileCatalogPersister';
import { Entry, EntryInfo, CatalogerOptions } from './types';

const SEPARATOR = ' ';

export default class Cataloger {
    public readonly persister: CatalogPersister;

    private readonly entries: Set<Entry>
    private readonly logger: Logger;
    private readonly logActionsAsInfo: boolean;

    constructor(options: CatalogerOptions) {
        const {
            logger,
            logActionsAsInfo = false,
        } = options;

        this.logger = logger.child({ area: 'cataloger' });
        this.entries = new Set();
        this.persister = new FileCatalogPersister({ ...options, logger });
        this.logActionsAsInfo = logActionsAsInfo;
    }

    unique({ name, version }: EntryInfo) {
        return `${name}${SEPARATOR}${version}`.toLowerCase();
    }

    parse(entry: Entry) {
        const [name, version] = entry.split(SEPARATOR);
        return { name, version };
    }

    async initialize() {
        const { persister, entries } = this;

        try {
            await persister.initialize(entries);
        }
        catch (error) {
            this.logger.error(error);
        }
    }

    async catalog(packageInfo: EntryInfo) {
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
                this.persister.append(entry);
                logger.debug(`${entry} was persisted`);
            }
            catch (error) {
                logger.error(error);
            }
        }
    }

    * stream<T>(transformer?: (input: EntryInfo) => T): Iterable<T> {
        const transform = transformer || (value => value as any as T);
        for (const entry of this.entries.values()) {
            const parsed = this.parse(entry);
            const mapped = transform(parsed);
            yield mapped;
        }
    }

    contains(packageInfo: EntryInfo) {
        const entry = this.unique(packageInfo);
        const contains = this.entries.has(entry);
        const logger = this.logger.child({ method: 'contains' });

        logger.debug(contains ? 'the package is in the catalog' : 'the package is not in the catalog', packageInfo);
        return contains;
    }

    exists() {
        return this.persister.exists();
    }
}
