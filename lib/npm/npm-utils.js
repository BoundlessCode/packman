const { URL } = require('url');
var validate = require('validate-npm-package-name');

const { execute } = require('../core/shell');

const NPM_ALL_ENDPOINT = '/-/all';

async function getCurrentRegistry({ logger }) {
    return await execute('npm get registry', { logger });
}

function getScopedPackageName({ packageName, packageScope }) {
    return packageScope ? `${packageScope}/${packageName}` : packageName;
}

function getPackageUrl(packageInfo) {
    const packageName = getScopedPackageName(packageInfo);
    const { packageVersion } = packageInfo;
    const fullName = packageVersion ? `${packageName}/${packageVersion}` : packageName;
    return new URL(fullName, packageInfo.registry);
}

function isValidPackageName(name) {
    const result = validate(name);
    return result.validForNewPackages || result.validForOldPackages;
}

module.exports = {
    getCurrentRegistry,
    NPM_ALL_ENDPOINT,
    getScopedPackageName,
    getPackageUrl,
    isValidPackageName,
};
