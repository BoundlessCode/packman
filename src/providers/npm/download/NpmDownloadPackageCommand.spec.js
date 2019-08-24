const {
    DEFAULT_TIMEOUT_INTERVAL,
    expectPathToExist,
    cleanup,
    tarballsDirectory,
    logger,
} = require('../../../../test/test-utils');

const NpmDownloadPackageCommand = require('./NpmDownloadPackageCommand');

describe('the (package) command', function () {
    this.timeout(DEFAULT_TIMEOUT_INTERVAL);

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

    it('should work for package with varied dependencies and devDependencies', async function () {
        const command = new NpmDownloadPackageCommand();
        const options = {
            name: '@boco/packman',
            version: '0.10.0',
            directory: tarballsDirectory,
            devDependencies: true,
            logger,
        };

        await command.execute(options);

        const paths = [
            ['colors'],
            ['@boco', 'sade'],
            ['@hapi', 'bourne'],
            ['mkdirp'],
            ['request'],
            ['request-promise'],
            ['semver'],
            ['tar'],
            ['@types', 'node'],
            ['mocha'],
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
