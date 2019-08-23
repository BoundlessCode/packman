const prompt = require('password-prompt');

async function getBasicAuthHeader() {
    const username = await prompt('Username: ', { method: 'mask' });
    const password = await prompt('Password: ', { method: 'hide' });
    const base64 = Buffer.from(`${username}:${password}`).toString('base64');
    const header = `Basic ${base64}`;
    return header;
}

module.exports = {
    getBasicAuthHeader,
};
