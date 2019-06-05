const request = require('request-promise');
const { URL } = require('url');
const { createReadStream } = require('fs');
const { getBasicAuthHeader } = require('./auth');
require('colors');

const { publish } = require('./publisher');
const { execute } = require('../../core/shell');

/**
 * @param {string} packagePath
 * @param {string} registry
 */
async function publishNpmCommand(packagePath, registry, distTag = true) {
  const publisher = new NpmPublisher({ packagePath, registry, distTag });
  await publish(publisher);
}

async function publishNexusApiCommand(packagePath, registry, distTag) {
  const publisher = new NexusApiPublisher({ packagePath, registry, distTag });
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
    const { packagePath, registry } = this.options;
    await execute(`npm publish ${packagePath} --registry ${registry}`, { stdio: [0, 1, 2] });
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
    const { packagePath, registry, authHeader } = this.options;
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
    console.log(`[${this.options.index}] [${'uploaded'.green}] ${packagePath}`, response.statusCode);
  }
}

module.exports = {
  publishNpmCommand,
  publishNexusApiCommand,
};
