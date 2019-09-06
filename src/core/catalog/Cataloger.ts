import { Logger, LoggerOptions } from '../logger';
import CatalogPersister from './CatalogPersister';
import FileCatalogPersister, { FileCatalogPersisterOptions } from './FileCatalogPersister';
import MemoryCatalogPersister, { MemoryCatalogPersisterOptions } from './MemoryCatalogPersister';
import Entry from './Entry';
import EntryInfo from './EntryInfo';

const SEPARATOR = ' ';

type CatalogerOptions =
    LoggerOptions
    & FileCatalogPersisterOptions
    & MemoryCatalogPersisterOptions
    & {
        logActionsAsInfo?: boolean
        mode?: 'file' | 'memory'
    }

export default class Cataloger {
    public readonly persister: CatalogPersister;

    private readonly logger: Logger;
    private readonly logActionsAsInfo: boolean;

    constructor(options: CatalogerOptions) {
        const {
            logger,
            logActionsAsInfo = false,
            mode = 'file',
        } = options;

        this.logger = logger.child({ area: 'cataloger' });

        const memoryPersister = new MemoryCatalogPersister({ ...options, logger });
        this.persister =
            mode === 'file'
                ? new FileCatalogPersister({ ...options, logger }, memoryPersister)
                : memoryPersister;

        this.logActionsAsInfo = logActionsAsInfo;
    }

    unique({ name, version }: EntryInfo) {
        return `${name}${SEPARATOR}${version}`.toLowerCase();
    }

    parse(entry: Entry) {
        const [name, version] = entry.split(SEPARATOR);
        return { name, version };
    }

    async initialize(persister: CatalogPersister = this.persister) {
        try {
            await persister.load();
        }
        catch (error) {
            this.logger.error(error);
        }
    }

    async catalog(packageInfo: EntryInfo) {
        const entry = this.unique(packageInfo);
        const logger = this.logger.child({ method: 'catalog', entry });
        const log = (this.logActionsAsInfo ? logger.info : logger.debug).bind(logger);
        const persister = this.persister;

        if (persister.has(entry)) {
            log(`${entry} is already in the set`.yellow);
        }
        else {
            try {
                await this.persister.append(entry);
                logger.debug(`${entry} was persisted`);
            }
            catch (error) {
                logger.error(error);
            }
        }
    }

    async remove(entryInfo: EntryInfo) {
        const entry = this.unique(entryInfo);
        await this.persister.remove(entry);
        this.logger.debug(`${entry} was removed from the set`);
    }

    * stream<T>(transformer?: (input: EntryInfo) => T): Iterable<T> {
        const transform = transformer || (value => value as any as T);
        for (const entry of this.persister.stream()) {
            const parsed = this.parse(entry);
            const mapped = transform(parsed);
            yield mapped;
        }
    }

    contains(packageInfo: EntryInfo) {
        const entry = this.unique(packageInfo);
        const contains = this.persister.has(entry);
        const logger = this.logger.child({ method: 'contains' });

        logger.debug(contains ? 'the package is in the catalog' : 'the package is not in the catalog', packageInfo);
        return contains;
    }

    exists() {
        return this.persister.exists();
    }
}
