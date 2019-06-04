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
async function publishNpmCommand(packagePath, registry) {
  const publisher = new NpmPublisher({ packagePath, registry });
  publisher.run();
}

async function publishNexusApiCommand(packagePath, registry) {
  const publisher = new NexusApiPublisher({ packagePath, registry });
  publisher.run();
}

class Publisher {
  run() {
    publish({
      publish: this.publish,
      prepare: this.prepare,
      distTag: this.distTag,
    });
  }

  async publish() { }

  async prepare() { }
}

class NpmPublisher extends Publisher {
  constructor(options) {
    super();

    this.options = {
      ...options,
      distTag: true,
    };
  }

  async publish() {
    const { packagePath, registry } = this.options;
    await execute(`npm publish ${packagePath} --registry ${registry}`, { stdio: [0, 1, 2] });
  }
}

class NexusApiPublisher extends Publisher {
  constructor(options) {
    super();

    this.options = options;
  }

  async prepare() {
    const authHeader = await getBasicAuthHeader();
    return {
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
