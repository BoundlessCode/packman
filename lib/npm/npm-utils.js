const { execute } = require('../core/shell');

async function getCurrentRegistry({ logger }) {
    return await execute('npm get registry', { logger });
}

module.exports = {
    getCurrentRegistry,
};
