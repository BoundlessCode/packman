const fs = require('fs');
const path = require('path');

const { getCurrentRegistry } = require('../npm-utils');
const { getScopedPackageName, packageVersionExists, updateDistTagToLatest, normalizeTgzsDirectory } = require('./npm-publish-utils');
const { createCounter } = require('../../core/counter');

const TARBALL_EXTENSION = '.tgz';

async function publish(publisher) {
    const data = await initialize({ options: publisher.options });

    publisher.prepare();

    const counter = createCounter();

    try {
        await publishPackages(data, counter, publisher);
    }
    catch (error) {
        printErrors(error, { logger });
        process.exit(1);
    }
}

async function publishPackages(data, counter, publisher) {
    const errors = [];
    for (const package of await collectPackagesByPath(data, counter)) {
        try {
            await publishPackage(package, publisher);
        }
        catch (error) {
            const message = error && error.message ? error.message : error;
            errors.push(`[${package.index}] [${'error'.red}] ${package.packagesPath} ${message}`);
        }
    }
    if (errors.length > 0) {
        throw errors;
    }
}

async function initialize(options = {}) {
    const { logger } = options;
    const rootPackagesPath = normalizeTgzsDirectory(options.packagesPath);
    logger.debug(`-> root packages path: ${rootPackagesPath.bgGreen}`);

    const registry = await getCurrentRegistry({ logger });
    logger.info(`-> registry: ${registry.bgGreen}`);

    return {
        ...options,
        rootPackagesPath,
        packagesPath: rootPackagesPath,
        registry,
    };
}

function* collectPackagesByPath(data, counter) {
    for (const packageDirectory of fs.readdirSync(data.packagesPath)) {
        const packagesPath = path.join(data.packagesPath, packageDirectory);
        if (packageDirectory.startsWith('@')) {
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
    for (const packageFile of fs.readdirSync(packagesPath)) {
        if (path.extname(packageFile) === TARBALL_EXTENSION) {
            counter.increment();
            yield {
                ...data,
                index: counter.current,
                packagePath: path.join(packagesPath, packageFile),
                version: packageFile.substring(name.length + 1).replace(TARBALL_EXTENSION, ''),
            };
        }
    }
}

async function publishPackage(package, publisher) {
    const { registry, index, packagePath, name, version } = package;
    const { logger } = publisher.options;

    if (await packageVersionExists(package)) {
        logger.info('publish', `[${index}] [${'exists'.yellow}] ${getScopedPackageName(package)} ${version}`);
        return;
    }

    logger.info('publish', `[${index}] [${'publishing'.cyan}] ${packagePath} ...`);
    await publisher.publish(package);

    // we only support updating the dist-tag when the package comes from the target registry
    if (publisher.distTag && publisher.options.registry === package.registry) {
        await updateDistTagToLatest(registry, name, logger);
    }
}

function printErrors(error = [], { logger }) {
    const errors =
        error instanceof Array
            ? error
            : [JSON.stringify(error), error.message || error];

    errors.forEach(error => logger.error(error));
}

module.exports = {
    publish,
};
