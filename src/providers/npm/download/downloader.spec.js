const { expect } = require('chai');

const {
    tarballsDirectory,
    logger,
} = require('../../../../test/test-utils');

const { getTarballUrl } = require('./downloader');

describe('downloader', function() {

    describe('#getTarballUrl', function() {

        it('returns passed url if it ends with .tgz extension', async function() {
            const url = 'http://host/x.tgz';
            const result = await getTarballUrl(url, tarballsDirectory, logger);
            expect(result).to.equal(url);
        });
        
    });

});
