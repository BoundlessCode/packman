const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

const tarballsDirectory = path.resolve(__dirname, 'test-tarballs');

const { logger } = require('../lib/core/logger');
logger.level = 'silent';

const DEFAULT_TIMEOUT_INTERVAL = 15000;

function expectPathToExist(directoryPath) {
    const packagePath = path.join(tarballsDirectory, ...directoryPath);
    expect(fs.existsSync(packagePath), `${packagePath} doesn't exist`).to.be.true;
}

function cleanup(directory) {
    try {
        if (fs.existsSync(directory))
            rimraf.sync(directory);
    } catch (error) {
        cleanup(directory);
    }
}

function getFilePath(file) {
    return path.join(__dirname, file);
}

module.exports = {
    DEFAULT_TIMEOUT_INTERVAL,
    expectPathToExist,
    cleanup,
    getFilePath,
    tarballsDirectory,
    logger,
};
