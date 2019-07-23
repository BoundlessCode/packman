const { join } = require('path');
const { once } = require('events');
const { appendFileSync, createReadStream, existsSync } = require('fs');
const { createInterface } = require('readline');

const log = require('./logger');

class Tracker {
    constructor({ directory }) {
        this.entries = new Set();
        this.fullPath = join(directory, '.packman-tracker.dat');
    }

    unique({ name, version }) {
        return `${name}@${version}`.toLowerCase();
    }

    async initialize() {
        const lead = ['Tracker', 'initialize'];
        const fullPath = this.fullPath;
        const entries = this.entries;

        try {
            if (existsSync(fullPath)) {
                log(lead, 'loading', fullPath);
                const readline = createInterface({
                    input: createReadStream(fullPath),
                    crlfDelay: Infinity,
                });

                readline.on('line', (line) => {
                    entries.add(line);
                    log(lead, 'loaded', line, 'to set');
                });

                await once(readline, 'close');

                log(lead, 'done');
            }
            else {
                log(lead, 'file does not exist:', fullPath);
            }
        }
        catch (err) {
            log(lead, 'error', err);
        }
    }

    async track(packageInfo) {
        const fullPath = this.fullPath;
        const entry = this.unique(packageInfo);
        const lead = ['Tracker', 'track', entry];

        const entries = this.entries;
        if (entries.has(entry)) {
            log(lead, 'exists in set');
        }
        else {
            entries.add(entry);
            log(lead, 'added to set');
            try {
                appendFileSync(fullPath, entry + '\n', 'utf8');
                log(lead, 'appended to', fullPath);
            }
            catch(error) {
                log(lead, error);
            }
        }
    }

    contains(packageInfo) {
        const entry = this.unique(packageInfo);
        return this.entries.has(entry);
    }
}

module.exports = Tracker;
