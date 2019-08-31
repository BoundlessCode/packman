import { URL } from 'url';
import { createReadStream } from 'fs';

import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import { fetch } from '../../../core/fetcher';
import PackageInfo from '../../../core/PackageInfo';

type NexusApiPublisherOptions = PublisherOptions & {
  registry: string
  packagesPath: string
  // packagePath: string
  catalog?: string
  distTag: boolean
}

type PublishResponse = {
  statusCode: number
}

export default class NexusApiPublisher extends Publisher<NexusApiPublisherOptions> {
  constructor(options: NexusApiPublisherOptions) {
    super(options);
  }

  async publish() {
    const { registry, packagesPath, catalog, logger } = this.options;
    const { origin } = new URL(registry);
    const uploadComponentUrl = new URL('/service/rest/beta/components', origin);

    const response = await fetch<PublishResponse>({
      uri: uploadComponentUrl,
      qs: { repository: 'npm' },
      method: 'POST',
      useBasicAuthHeader: true,
      contentType: 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      formData: {
        'npm.asset': createReadStream(packagesPath),
      },
      responseMode: 'full-response',
      logger,
    });

    logger.info(`[publish] [${catalog}] [${'uploaded'.green}] ${packagesPath}`, response.statusCode);
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions) {
  }

  async publishPackage(packageInfo: PackageInfo) {
  }
}
