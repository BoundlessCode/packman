const { expect } = require('chai');

const { getTarballUrl } = require('./downloader');

describe('downloader', function() {

    describe('#getTarballUrl', function() {

        it('returns passed url if it ends with .tgz extension', async function() {
            const url = 'x.tgz';
            const result = await getTarballUrl(url);
            expect(result).to.equal(url);
        });
        
    });

});
