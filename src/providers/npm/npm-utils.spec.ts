import { expect } from 'chai';

import Counter from '../../core/counter';
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
        const baseOptions = {
            counter: new Counter(),
            extension,
            registry: 'https://registry',
        }

        it('returns package info for simple versioned package', function () {
            const name = 'simple';
            const version = '1.2.3';
            const options = {
                ...baseOptions,
                filePath: `/path/to/${name}/${name}-${version}${extension}`,
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
                ...baseOptions,
                filePath: `/path/to/${scope}/${name}/${name}-${version}${extension}`,
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
                ...baseOptions,
                filePath: `/path/to/${scope}/${name}/${name}-${version}${extension}`,
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
                ...baseOptions,
                filePath: `file${extension}`,
                extension: `.${extension}`,
            };

            const packageInfo = getPackageFileInfo(options);

            expect(packageInfo).to.be.undefined;
        });
    });

});
