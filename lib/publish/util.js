const request = require('request-promise');
const semver = require('semver');
const path = require('path');
const { URL } = require('url');
const { execute } = require('./shell')

function getScopedPackageName({ name, scope }) {
    return scope ? `${scope}/${name}` : name;
}

function getPackageUrl(package) {
    const packageName = getScopedPackageName(package);
    return new URL(packageName, package.registry);
}

async function packageVersionExists(package) {
    try {
        const uri = getPackageUrl(package);
        const response = await request({ uri, json: true });
        return !!response.versions[version];
    }
    catch (error) {
        return false;
    }
}

async function updateDistTagToLatest(npmRegistry, name) {
    try {
        const packageDetails = await request({ uri: getPackageUrl(npmRegistry, name), json: true });
        const latest = semver.maxSatisfying(Object.keys(packageDetails.versions), '*');
        if (latest && latest !== packageDetails['dist-tags'].latest) {
            console.log(`[${'latest dist'.cyan}] ${name.replace('%2F', '/')} ${latest}`);
            await execute(`npm dist-tag add ${name.replace('%2F', '/')}@${latest}`, { stdio: [0, 1, 2] });
        }
        else {
            console.log(`[${'skipping update dist'.yellow}] ${name.replace('%2F', '/')}`);
        }
    }
    catch (error) {
        console.log(`[${'ERROR'.red}] ${error}`);
    }
}

function getTgzsDirectory() {
    const [, , tgzPath] = process.argv;
    if(path.isAbsolute(tgzPath)) return tgzPath;
    return path.join(process.cwd(), tgzPath);
}

module.exports = {
    getScopedPackageName,
    packageVersionExists,
    updateDistTagToLatest,
    getTgzsDirectory,
};
