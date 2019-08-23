const request = require('request-promise');
const semver = require('semver');

const { execute } = require('../../../core/shell')
const { getPackageUrl } = require('../npm-utils');

async function packageVersionExists(packageInfo, { lenientSsl, logger }) {
    const uri = getPackageUrl(packageInfo);
    try {
        logger.debug(`checking packageVersionExists, lenientSsl: ${lenientSsl}, uri: ${uri}`);
        const response = await request({
            uri,
            json: true,
            rejectUnauthorized: !lenientSsl, // https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
        });
        const version = packageInfo.packageVersion;
        return response.version === version || !!response.versions[version];
    }
    catch (error) {
        logger.debug('package version exists error', { packageInfo, uri, error });
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

module.exports = {
    packageVersionExists,
    updateDistTagToLatest,
};
