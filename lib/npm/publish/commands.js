const request = require('request-promise');
const { URL } = require('url');
const { createReadStream } = require('fs');
require('colors');

const { execute } = require('../../core/shell');
const log = require('../../core/logger');
const { getBasicAuthHeader } = require('./auth');
const { publish } = require('./publisher');

/**
 * @param {string} packagesPath
 * @param {string} registry
 * @param {boolean} distTag
 */
async function publishNpmCommand(packagesPath, registry, distTag = true) {
  const publisher = new NpmPublisher({ packagesPath, registry, distTag });
  await publish(publisher);
}

/**
 * @param {string} packagesPath
 * @param {string} registry
 * @param {boolean} distTag
 */
async function publishNexusApiCommand(packagesPath, registry, distTag) {
  const publisher = new NexusApiPublisher({ packagesPath, registry, distTag });
  await publish(publisher);
}

class Publisher {
  constructor(options) {
    this.options = options;
  }
}

class NpmPublisher extends Publisher {
  constructor(options) {
    super(options);
  }

  async prepare() { }

  async publish({ packagePath }) {
    const { registry } = this.options;
    await execute(`npm publish ${packagePath} --quiet --registry ${registry}`, { stdio: [0, 1, 2] });
  }
}

class NexusApiPublisher extends Publisher {
  constructor(options) {
    super(options);
  }

  async prepare() {
    const authHeader = await getBasicAuthHeader();
    this.options = {
      ...this.options,
      authHeader,
    };
  }

  async publish({ packagePath }) {
    const { registry, authHeader } = this.options;
    const { origin } = new URL(registry);
    const uploadComponentUrl = new URL('/service/rest/beta/components', origin);
    const response = await request({
      method: 'POST',
      uri: uploadComponentUrl,
      qs: { repository: 'npm' },
      headers: {
        authorization: authHeader,
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
      formData: {
        'npm.asset': createReadStream(packagePath),
      },
      resolveWithFullResponse: true,
    });
    log(['publish'], `[${this.options.index}] [${'uploaded'.green}] ${packagePath}`, response.statusCode);
  }
}

module.exports = {
  publishNpmCommand,
  publishNexusApiCommand,
};
