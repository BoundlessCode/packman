const request = require('request-promise');
const { URL } = require('url');
const { createReadStream } = require('fs');
const { getBasicAuthHeader } = require('./auth');
require('colors');

const { publish } = require('./publisher');
const { execute } = require('../../core/shell');

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

  async publish() {
    const { packagesPath, registry } = this.options;
    await execute(`npm publish ${packagesPath} --registry ${registry}`, { stdio: [0, 1, 2] });
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

  async publish() {
    const { packagesPath, registry, authHeader } = this.options;
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
        'npm.asset': createReadStream(packagesPath),
      },
      resolveWithFullResponse: true,
    });
    console.log(`[${this.options.index}] [${'uploaded'.green}] ${packagesPath}`, response.statusCode);
  }
}

module.exports = {
  publishNpmCommand,
  publishNexusApiCommand,
};
