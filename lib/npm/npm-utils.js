const { execute } = require('../core/shell');

async function getCurrentRegistry() {
    return await execute('npm get registry');
}

module.exports = {
    getCurrentRegistry,
};
