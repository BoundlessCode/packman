const {
    DEFAULT_TIMEOUT_INTERVAL,
    expectPathToExist,
    cleanup,
    tarballsDirectory,
    logger,
} = require('../../../test/test-utils');

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
