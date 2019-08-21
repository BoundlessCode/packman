const fs = require('fs');
const { isAbsolute, join } = require('path');
const request = require('request-promise');

/**
 * @param { string } uri
 * @param { { json: boolean } } options
 */
async function retrieveFile(uri, { json, logger } = { json: false }) {
  logger.debug('retrieving file', uri.yellow)
  const url = normalizeUrl(uri);
  if (fs.existsSync(url)) {
    return url.endsWith('json') ? require(url) : fs.readFileSync(url).toString();
  }
  try {
    return await request({ url, json: json || url.endsWith('json') });
  } catch (error) {
    logger.error(`failed to download the file from ${url}`);
  }
}

function normalizeUrl(uri) {
  let url;
  if (uri instanceof URL) {
    url = uri.href;
  }
  else if (uri.startsWith('http') || isAbsolute(uri)) {
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
