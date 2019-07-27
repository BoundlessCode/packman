const request = require('request-promise');
const semver = require('semver');
const path = require('path');
const { URL } = require('url');

const { execute } = require('../../core/shell')

function getScopedPackageName({ name, scope }) {
    return scope ? `${scope}/${name}` : name;
}

function getPackageUrl(package) {
    const packageName = getScopedPackageName(package);
    return new URL(packageName, package.registry);
}

async function packageVersionExists(package, logger) {
    const uri = getPackageUrl(package);
    try {
        const response = await request({ uri, json: true });
        return !!response.versions[package.version];
    }
    catch (error) {
        logger.debug('package version exists error', { package, uri, error });
        return false;
    }
}

async function updateDistTagToLatest(registry, name, logger) {
    const childLogger = logger.child({ area: 'update dist-tag' });
    try {
        const packageDetails = await request({ uri: getPackageUrl({ registry, name }), json: true });
        const latest = semver.maxSatisfying(Object.keys(packageDetails.versions), '*');
        const prettyName = name.replace('%2F', '/');
        if (latest && latest !== packageDetails['dist-tags'].latest) {
            childLogger.info(`[${'latest dist'.cyan}] ${prettyName} ${latest}`);
            await execute(`npm dist-tag add ${prettyName}@${latest}`, { stdio: [0, 1, 2], childLogger });
        }
        else {
            childLogger.info(`[${'skipping update dist'.yellow}] ${prettyName}`);
        }
    }
    catch (error) {
        childLogger.error(error);
    }
}

function normalizeTgzsDirectory(packagesPath) {
    return path.isAbsolute(packagesPath)
        ? packagesPath
        : path.join(process.cwd(), packagesPath);
}

module.exports = {
    getScopedPackageName,
    packageVersionExists,
    updateDistTagToLatest,
    normalizeTgzsDirectory,
};
