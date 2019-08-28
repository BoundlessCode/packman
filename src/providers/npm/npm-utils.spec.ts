import { expect } from 'chai';

import { getScopedPackageName } from './npm-utils';

describe('npm-utils', function() {

    describe('#getScopedPackageName', function() {

        it('returns unscoped package name as is', function() {
            const packageName = 'pkg';
            const result = getScopedPackageName({ packageName });
            expect(result).to.equal(packageName);
        });
        
    });

});
