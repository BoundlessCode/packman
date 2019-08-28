import { expect } from 'chai';

import {
    tarballsDirectory,
    logger,
} from '../../../test/test-utils';

import { getTarballUrl } from './downloader';

describe('downloader', function() {

    describe('#getTarballUrl', function() {

        it('returns passed url if it ends with .tgz extension', async function() {
            const url = 'http://host/x.tgz';
            const result = await getTarballUrl(url, tarballsDirectory, logger);
            expect(result).to.equal(url);
        });
        
    });

});
