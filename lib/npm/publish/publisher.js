const fs = require('fs');
const path = require('path');

const { getCurrentRegistry } = require('../npm-utils');
const { getScopedPackageName, packageVersionExists, updateDistTagToLatest, normalizeTgzsDirectory } = require('./util');
const { createCounter } = require('./counter');

require('colors');

async function publish(publisher) {
    let data = await initialize(publisher.options);

    publisher.prepare();

    const counter = createCounter();

    publishPackages(data, counter, publisher)
        .catch(error => {
            printErrors(error);
            process.exit(1);
        });
}

async function publishPackages(data, counter, publisher) {
    const errors = [];
    for(const package of await collectPackagesByPath(data, counter)) {
        try {
            await publishPackage(package, publisher);
        }
        catch(error) {
            const message = error && error.message ? error.message : error;
            errors.push(`[${package.index}] [${'error'.red}] ${package.packagesPath} ${message}`);
        }
    }
    if(errors.length > 0) {
        throw errors;
    }
}

async function initialize(data = {}) {
    const rootPackagesPath = normalizeTgzsDirectory(data.packagesPath);
    console.debug(`-> root packages path: ${rootPackagesPath.bgGreen}`);

    const registry = await getCurrentRegistry();
    console.info(`-> registry: ${registry.bgGreen}`);

    return {
        ...data,
        rootPackagesPath,
        packagesPath: rootPackagesPath,
        registry,
    };
}

function* collectPackagesByPath(data, counter) {
    for(const packageDirectory of fs.readdirSync(data.packagesPath)) {
        const packagesPath = path.join(data.packagesPath, packageDirectory);
        if(packageDirectory.startsWith('@')) {
            yield* collectPackagesByPath({
                ...data,
                scope: packageDirectory,
                packagesPath,
            }, counter);
        }
        else {
            yield* collectPackagesWithKnownName({
                ...data,
                name: packageDirectory,
                packagesPath,
            }, counter);
        }
    }
}

function* collectPackagesWithKnownName(data, counter) {
    const { packagesPath, name } = data;
    for(const packageFile of fs.readdirSync(packagesPath)) {
        counter.increment();
        yield {
            ...data,
            index: counter.current,
            packagePath: path.join(packagesPath, packageFile),
            version: packageFile.substring(name.length + 1).replace('.tgz', ''),
        };
    }
}

async function publishPackage(package, publisher) {
    const { registry, index, packagePath, name, version } = package;

    if(await packageVersionExists(package)) {
        console.log(`[${index}] [${'exists'.yellow}] ${getScopedPackageName(package)} ${version}`);
        return;
    }

    console.log(`[${index}] [${'publishing'.cyan}] ${packagePath} ...`);
    await publisher.publish(package);

    // we only support updating the dist-tag when the package comes from the target registry
    if(publisher.distTag && publisher.options.registry === package.registry) {
        await updateDistTagToLatest(registry, name);
    }
}

function printErrors(error = []) {
    const errors =
        error instanceof Array
            ? error
            : [JSON.stringify(error), error.message || error];
    
    errors.forEach(error => console.error(error));
}

module.exports = {
    publish,
};
