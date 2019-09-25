import { expect } from 'chai';

import Counter from '../../core/counter';
import { getPackageFileInfo, WHEEL_EXTENSION } from './pypi-utils';

describe('pypi-utils', function () {

    describe('#getPackageFileInfo', function () {
        const extension = `.${WHEEL_EXTENSION}`;
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
                filePath: `${name}-${version}${extension}`,
            };

            const packageInfo = getPackageFileInfo(options);

            expect(packageInfo).to.include({
                packageName: name,
                packageVersion: version,
            });
        });
    });

});
