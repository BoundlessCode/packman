const { URL } = require('url');
var validate = require('validate-npm-package-name');

const { execute } = require('../core/shell');

async function getCurrentRegistry({ logger }) {
    return await execute('npm get registry', { logger });
}

function getScopedPackageName({ packageName, packageScope }) {
    return packageScope ? `${packageScope}/${packageName}` : packageName;
}

function getVersionedPackageName({ packageName, packageScope, packageVersion }) {
    const scopedName = getScopedPackageName({ packageName, packageScope })
    return packageVersion ? `${scopedName}/${packageVersion}` : scopedName;
}

function getPackageUrl(packageInfo) {
    const fullName = getVersionedPackageName(packageInfo);
    return new URL(fullName, packageInfo.registry);
}

function isValidPackageName(name) {
    const result = validate(name);
    return result.validForNewPackages || result.validForOldPackages;
}

function getAllEndpointUrl(registry, { logger }) {
    // do not add the initial '/' because it will resolve incorrectly when using the URL ctor
    const NPM_ALL_ENDPOINT = '-/all';
    const url = new URL(NPM_ALL_ENDPOINT, registry);
    logger.debug(`all endpoint located at ${url}`);
    return url;
}

module.exports = {
    getCurrentRegistry,
    getAllEndpointUrl,
    getScopedPackageName,
    getVersionedPackageName,
    getPackageUrl,
    isValidPackageName,
};
