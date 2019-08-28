import { expect } from 'chai';
import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';
import 'colors';

export const tarballsDirectory = path.resolve(__dirname, 'test-tarballs');

export const { logger } = require('../core/logger');
logger.level = 'silent';

export const DEFAULT_TIMEOUT_INTERVAL = 15000;

export function expectPathToExist(directoryPath) {
    const packagePath = path.join(tarballsDirectory, ...directoryPath);
    expect(fs.existsSync(packagePath), `${packagePath} doesn't exist`).to.be.true;
}

export function cleanup(directory) {
    try {
        if (fs.existsSync(directory))
            rimraf.sync(directory);
    } catch (error) {
        cleanup(directory);
    }
}

export function getFilePath(file) {
    return path.join(__dirname, file);
}
