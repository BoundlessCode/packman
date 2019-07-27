const fs = require('fs');
const path = require('path');
const globby = require('globby');

const { getCurrentRegistry } = require('../npm-utils');
const { getScopedPackageName, packageVersionExists, updateDistTagToLatest, normalizeTgzsDirectory } = require('./npm-publish-utils');
const { createCounter } = require('../../core/counter');

const TARBALL_EXTENSION = 'tgz';

async function publish(publisher) {
    const { options } = publisher;
    const { logger } = options;
    const data = await initialize(options);

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
    const { logger } = publisher.options;
    const errors = [];
    for (const package of await collectPackagesByPath(data, { counter, logger })) {
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

async function initialize(options) {
    const { logger } = options;

    const rootPackagesPath = normalizeTgzsDirectory(options.packagesPath);
    logger.info(`root packages path: ${rootPackagesPath.green}`);

    const registry = await getCurrentRegistry({ logger });
    logger.info(`registry: ${registry.green}`);

    return {
        ...options,
        rootPackagesPath,
        packagesPath: rootPackagesPath,
        registry,
    };
}

function* collectPackagesByPath(data, { counter, logger }) {
    const { packagesPath } = data;
    
    const filePaths = collectFilePaths(packagesPath, logger);

    for (const filePath of filePaths) {
        logger.debug('collecting', filePath);

        yield collectPackageFile({ ...data, filePath }, counter);
    }
}

function collectFilePaths(packagesPath, logger) {
    const stat = fs.lstatSync(packagesPath);

    const filePaths = [];
    if (stat.isFile()) {
        filePaths.push(packagesPath);
    }
    else {
        const extension = `.${TARBALL_EXTENSION}`;
        const glob = `${packagesPath}/**/*${extension}`;
        filePaths.push(...globby.sync(glob));
    }

    logger.debug('list of files to collect', filePaths);
    return filePaths;
}

function collectPackageFile(data, counter) {
    const { filePath } = data;
    const extension = `.${TARBALL_EXTENSION}`;
    const fileName = path.basename(filePath, extension);
    const separatorIndex = fileName.lastIndexOf('-');

    if (path.extname(filePath) === extension) {
        counter.increment();
        return {
            ...data,
            index: counter.current,
            packagesPath: path.dirname(filePath),
            packagePath: filePath, // path.join(packagesPath, packageFile),
            name: fileName.slice(0, separatorIndex),
            version: fileName.slice(separatorIndex + 1),
        };
    }
}

async function publishPackage(package, publisher) {
    const { registry, index, packagePath, name, version } = package;
    const { logger } = publisher.options;

    if (await packageVersionExists(package, logger)) {
        logger.info('publish', `[${index}] [${'exists'.yellow}] ${getScopedPackageName(package)} ${version}`);
        return;
    }

    logger.debug('publish', `[${index}] [${'publishing'.cyan}] ${packagePath} ...`);
    await publisher.publish(package);
    logger.info('publish', `[${index}] [${'published'.green}] ${getScopedPackageName(package)} ${version}`);

    // we only support updating the dist-tag when the package comes from the target registry
    if (publisher.distTag && publisher.options.registry === package.registry) {
        logger.debug('publish', `[${index}] [${'updating dist-tag'.cyan}] ${packagePath} ...`);
        await updateDistTagToLatest(registry, name, logger);
        logger.info('publish', `[${index}] [${'updated dist-tag'.green}] ${getScopedPackageName(package)} ${version}`);
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
