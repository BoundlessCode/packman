const fs = require('fs');
const globby = require('globby');

const { createCounter } = require('./counter');

function* collectPackagesByPath(options) {
    const { rootPath, logger, extension, getPackageFileInfo } = options;

    const counter = createCounter();

    const filePaths = collectFilePaths({ rootPath, logger, extension });

    for (const filePath of filePaths) {
        logger.debug('collecting', filePath);

        yield getPackageFileInfo({ ...options, filePath, counter });
    }
}

function collectFilePaths({ rootPath, logger, extension }) {
    const stat = fs.lstatSync(rootPath);

    const filePaths = [];
    if (stat.isFile()) {
        filePaths.push(rootPath);
    }
    else {
        const glob = `${rootPath}/**/*${extension}`;
        filePaths.push(...globby.sync(glob));
    }

    logger.debug('list of files to collect', filePaths);
    return filePaths;
}

module.exports = {
    collectPackagesByPath,
};
