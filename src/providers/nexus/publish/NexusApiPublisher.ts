import request from 'request-promise';
import { URL } from 'url';
import { createReadStream } from 'fs';

import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import { getBasicAuthHeader } from '../../../core/auth';
import PackageInfo from '../../../core/PackageInfo';

type NexusApiPublisherOptions = PublisherOptions & {
  registry: string
  packagesPath: string
  // packagePath: string
  catalog?: string
  distTag: boolean
}

export default class NexusApiPublisher extends Publisher<NexusApiPublisherOptions> {
  constructor(options: NexusApiPublisherOptions) {
    super(options);
  }

  async publish() {
    const { registry, packagesPath, catalog, logger } = this.options;
    const { origin } = new URL(registry);
    const uploadComponentUrl = new URL('/service/rest/beta/components', origin);
    const authHeader = await getBasicAuthHeader();
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
    logger.info(`[publish] [${catalog}] [${'uploaded'.green}] ${packagesPath}`, response.statusCode);
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions) {
  }

  async publishPackage(packageInfo: PackageInfo) {
  }
}
