import {
    DEFAULT_TIMEOUT_INTERVAL,
    expectPathToExist,
    cleanup,
    tarballsDirectory,
    getFilePath,
    logger,
} from '../../../test/test-utils';

import NpmDownloadPackageLockCommand from './NpmDownloadPackageLockCommand';

xdescribe('the (package-lock.json) command', function () {
    this.timeout(DEFAULT_TIMEOUT_INTERVAL);

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
            ['mkdirp'], ['mkdirp', 'mkdirp-0.5.1.tgz'],
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
