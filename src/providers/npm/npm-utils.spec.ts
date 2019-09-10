import { expect } from 'chai';

import { getScopedPackageName, getPackageFileInfo, TARBALL_EXTENSION } from './npm-utils';

describe('npm-utils', function () {

    describe('#getScopedPackageName', function () {

        it('returns unscoped package name as is', function () {
            const packageName = 'pkg';
            const result = getScopedPackageName({ packageName });
            expect(result).to.equal(packageName);
        });

    });

    describe('#getPackageFileInfo', function () {
        const extension = `.${TARBALL_EXTENSION}`;

        it('returns package info for simple versioned package', function () {
            const name = 'simple';
            const version = '1.2.3';
            const options = {
                filePath: `/path/to/${name}/${name}-${version}${extension}`,
                extension,
            };

            const packageInfo = getPackageFileInfo(options);

            expect(packageInfo).to.include({
                packageName: name,
                packageVersion: version,
                packageScope: undefined,
            });
        });

        it('returns package info for simple scoped and versioned package', function () {
            const name = 'simple';
            const version = '1.2.3';
            const scope = '@ns';
            const options = {
                filePath: `/path/to/${scope}/${name}/${name}-${version}${extension}`,
                extension,
            };

            const packageInfo = getPackageFileInfo(options);

            expect(packageInfo).to.include({
                packageName: name,
                packageVersion: version,
                packageScope: scope,
            });
        });

        it('returns package info for scoped and versioned package with pre-release version', function () {
            const name = 'simple';
            const version = '1.2.3-alpha-4';
            const scope = '@ns';
            const options = {
                filePath: `/path/to/${scope}/${name}/${name}-${version}${extension}`,
                extension,
            };

            const packageInfo = getPackageFileInfo(options);

            expect(packageInfo).to.include({
                packageName: name,
                packageVersion: version,
                packageScope: scope,
            });
        });

        it('returns undefined when extension argument has extraneous dot', function () {
            const options = {
                filePath: `file${extension}`,
                extension: `.${extension}`,
            };

            const packageInfo = getPackageFileInfo(options);

            expect(packageInfo).to.be.undefined;
        });
    });

});
