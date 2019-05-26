const fs = require('fs');
const path = require('path');

const { execute } = require('./shell');
const { getScopedPackageName, packageVersionExists, updateDistTagToLatest, getTgzsDirectory } = require('./util');
const { createCounter } = require('./counter');

require('colors');

async function publish(options) {
    let data = await initialize();

    const { prepare } = options;
    if(prepare) data = await prepare(data);

    const counter = createCounter();

    publishPackages(data, counter, options)
        .then(() => process.exit(0))
        .catch(error => {
            printErrors(error);
            process.exit(1);
        });
}

async function publishPackages(data, counter, options) {
    const errors = [];
    for(const package of await collectPackagesByPath(data, counter)) {
        try {
            await publishPackage(package, options);
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
    const rootPackagesPath = getTgzsDirectory();

    const registry = await execute('npm get registry');
    console.log(`using registry ${registry.bgGreen}`);

    return data = {
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

async function publishPackage(package, { publish, distTag = true }) {
    const { registry, index, packagePath, name, version } = package;

    if(await packageVersionExists(package)) {
        console.log(`[${index}] [${'exists'.yellow}] ${getScopedPackageName(package)} ${version}`);
        return;
    }

    console.log(`[${index}] [${'publishing'.cyan}] ${packagePath} ...`);
    await publish(package);

    if(distTag) {
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
