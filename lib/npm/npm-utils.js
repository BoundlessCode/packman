const { execute } = require('../core/shell');

const NPM_ALL_ENDPOINT = '/-/all';

async function getCurrentRegistry({ logger }) {
    return await execute('npm get registry', { logger });
}

module.exports = {
    getCurrentRegistry,
    NPM_ALL_ENDPOINT,
};
