const fs = require('fs');
const globby = require('globby');

const { createCounter } = require('./counter');

function* collectPackagesByPath(data, getPackageFileInfo, logger, extension) {
    const { packagesPath } = data;
    const counter = createCounter();

    const filePaths = collectFilePaths(packagesPath, logger, extension);

    for (const filePath of filePaths) {
        logger.debug('collecting', filePath);

        yield getPackageFileInfo({ ...data, filePath }, counter, extension);
    }
}

function collectFilePaths(packagesPath, logger, extension) {
    const stat = fs.lstatSync(packagesPath);

    const filePaths = [];
    if (stat.isFile()) {
        filePaths.push(packagesPath);
    }
    else {
        const glob = `${packagesPath}/**/*${extension}`;
        filePaths.push(...globby.sync(glob));
    }

    logger.debug('list of files to collect', filePaths);
    return filePaths;
}

module.exports = {
    collectPackagesByPath,
};
