const request = require('request-promise');
const { URL } = require('url');
const { createReadStream } = require('fs');

const log = require('../../core/logger');
const Publisher = require('../../core/Publisher');
const { getBasicAuthHeader } = require('../../core/auth');

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

module.exports = NexusApiPublisher;
