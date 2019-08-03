const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

const NpmDownloadPackageJsonCommand = require('../lib/npm/download/NpmDownloadPackageJsonCommand');
const NpmDownloadPackageLockCommand = require('../lib/npm/download/NpmDownloadPackageLockCommand');
const NpmDownloadPackageCommand = require('../lib/npm/download/NpmDownloadPackageCommand');

const tarballsDirectory = './test-tarballs';

const { logger } = require('../lib/core/logger');
// require('../lib/core/logger').ignore = true;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

describe('the (package.json) command', function () {
    afterEach(function () {
        cleanup(tarballsDirectory);
    });

    it('should work for a simple package', async function () {
        const command = new NpmDownloadPackageJsonCommand();
        const options = {
            uri: getFilePath('./test-data/simple/package.json'),
            directory: tarballsDirectory,
            logger,
        };

        await command.execute(options);

        expectPathToExist(['express']);
        expectPathToExist(['express', 'express-4.16.4.tgz']);
    });

    it('should work for the current package', async function () {
        const command = new NpmDownloadPackageJsonCommand();
        const options = {
            uri: getFilePath('./test-data/current/package.json'),
            directory: tarballsDirectory,
            devDependencies: true,
            logger,
        };

        await command.execute(options);

        const paths = [
            ['colors'], ['colors', 'colors-1.3.0.tgz'],
            ['commander'], ['commander', 'commander-2.16.0.tgz'],
            ['mkdirp'], ['mkdirp', 'mkdirp-0.5.1-tgz'],
            ['request'], ['request', 'request-2.87.0.tgz'],
            ['request-promise'], ['request-promise', 'request-promise-4.2.2.tgz'],
            ['semver'], ['semver', 'semver-5.5.0.tgz'],
            ['tar'], ['tar', 'tar-4.4.6.tgz'],
            ['@types', 'jasmine'], ['@types', 'jasmine', 'jasmine-2.8.9.tgz'],
            ['jasmine'], ['jasmine', 'jasmine-3.2.0.tgz'],
            ['rimraf'], ['rimraf', 'rimraf-2.6.2.tgz']
        ];
        for (const directoryPath of paths) {
            expectPathToExist(directoryPath);
        }
    });

    xit('should work for a big (react-scripts) package', async function () {
        const command = new NpmDownloadPackageJsonCommand();
        const options = {
            uri: getFilePath('./test-data/big/react-scripts/package.json'),
            directory: tarballsDirectory,
            devDependencies: true,
            peerDependencies: true,
            logger,
        };

        await command.execute(options);
    });

    xit('should work for a big (angular-cli) package', async function () {
        const command = new NpmDownloadPackageJsonCommand();
        const options = {
            uri: getFilePath('./test-data/big/angular-cli/package.json'),
            directory: tarballsDirectory,
            devDependencies: true,
            peerDependencies: true,
            logger,
        };

        await command.execute(options);
    });

});

describe('the (package-lock.json) command', function () {
    afterEach(function () {
        cleanup(tarballsDirectory);
    });

    it('should work for a simple package', async function () {
        const command = new NpmDownloadPackageLockCommand();
        const options = {
            uri: getFilePath('./test-data/simple/package-lock.json'),
            directory: tarballsDirectory,
            logger,
        };

        await command.execute(options);

        expectPathToExist(['express']);;
        expectPathToExist(['express', 'express-4.16.4.tgz']);
    });

    it('should work for the current package', async function () {
        const command = new NpmDownloadPackageLockCommand();
        const options = {
            uri: getFilePath('./test-data/current/package-lock.json'),
            directory: tarballsDirectory,
            logger,
        };

        await command.execute(options);

        const paths = [
            ['colors'], ['colors', 'colors-1.3.0.tgz'],
            ['commander'], ['commander', 'commander-2.16.0.tgz'],
            ['mkdirp'], ['mkdirp', 'mkdirp-0.5.1-tgz'],
            ['request'], ['request', 'request-2.87.0.tgz'],
            ['request-promise'], ['request-promise', 'request-promise-4.2.2.tgz'],
            ['semver'], ['semver', 'semver-5.5.0.tgz'],
            ['tar'], ['tar', 'tar-4.4.6.tgz'],
            ['@types', 'jasmine'], ['@types', 'jasmine', 'jasmine-2.8.9.tgz'],
            ['jasmine'], ['jasmine', 'jasmine-3.2.0.tgz'],
            ['rimraf'], ['rimraf', 'rimraf-2.6.2.tgz']
        ];
        for (const directoryPath of paths) {
            expectPathToExist(directoryPath);
        }
    });

    xit('should work for a big (react-scripts) package', async function () {
        const command = new NpmDownloadPackageLockCommand();
        const options = {
            uri: getFilePath('./test-data/big/react-scripts/package.json'),
            directory: tarballsDirectory,
            devDependencies: true,
            peerDependencies: true,
            logger,
        };

        await command.execute(options);
    });

    xit('should work for a big (angular-cli) package', async function () {
        const command = new NpmDownloadPackageLockCommand();
        const options = {
            uri: getFilePath('./test-data/big/angular-cli/package.json'),
            directory: tarballsDirectory,
            devDependencies: true,
            peerDependencies: true,
            logger,
        };

        await command.execute(options);
    });

});

describe('the (package) command', function () {
    afterEach(function () {
        cleanup(tarballsDirectory);
    });

    it('should work for a simple package', async function () {
        const command = new NpmDownloadPackageCommand();
        const options = {
            name: 'express',
            version: '4.16.4',
            directory: tarballsDirectory,
            logger,
        };

        await command.execute(options);

        expectPathToExist(['express']);
        expectPathToExist(['express', 'express-4.16.4.tgz']);
    });

    it('should work for the current package', async function () {
        const command = new NpmDownloadPackageCommand();
        const options = {
            name: 'node-tgz-downloader',
            directory: tarballsDirectory,
            logger,
        };

        await command.execute(options);

        const paths = [
            ['colors'],
            ['commander'],
            ['mkdirp'],
            ['request'],
            ['request-promise'],
            ['semver'],
            ['tar'],
            ['@types', 'jasmine'],
            ['jasmine'],
            ['rimraf'],
        ];
        for (const directoryPath of paths) {
            expectPathToExist(directoryPath)
        }
    });

    xit('should work for a big (react-scripts) package', async function () {
        const command = new NpmDownloadPackageCommand();
        const options = {
            name: 'react-scripts',
            directory: tarballsDirectory,
            devDependencies: true,
            peerDependencies: true,
            logger,
        };

        await command.execute(options);
    });

    xit('should work for a big (angular-cli) package', async function () {
        const command = new NpmDownloadPackageCommand();
        const options = {
            name: 'angular-cli',
            directory: tarballsDirectory,
            devDependencies: true,
            peerDependencies: true,
            logger,
        };

        await command.execute(options);
    });

});

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