const fs = require('fs');
const { isAbsolute, join } = require('path');
const request = require('request-promise');

/**
 * @param { string } uri
 */
async function retrieveFile(uri) {
  const url = normalizeUrl(uri);
  if (fs.existsSync(url)) {
    return url.endsWith('json') ? require(url) : fs.readFileSync(url).toString();
  }
  try {
    return await request({ url, json: url.endsWith('json') });
  } catch (error) {
    console.error(`failed to download the file from ${url}`);
    process.exit(1);
  }
}

function normalizeUrl(uri) {
  let url;
  if (uri.startsWith('http') || isAbsolute(uri)) {
    url = uri;
  }
  else {
    url = join(process.cwd(), uri);
  }
  return url;
}

module.exports = {
  retrieveFile,
};
