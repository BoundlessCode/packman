import { URL } from 'url';
import { createReadStream } from 'fs';

import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import { fetch } from '../../../core/fetcher';
import NexusPackageInfo from '../NexusPackageInfo';

type NexusPublisherOptions = PublisherOptions & {
  registry: string
  packagesPath: string
  // packagePath: string
  catalog?: string
  distTag: boolean
}

type PublishResponse = {
  statusCode: number
}

export default class NexusPublisher extends Publisher<NexusPublisherOptions, NexusPackageInfo> {
  constructor(options: NexusPublisherOptions) {
    super(options);
  }

  async publish() {
    const { registry, packagesPath, catalog, logger } = this.options;
    const { origin } = new URL(registry);
    const uploadComponentUrl = new URL('/service/rest/beta/components', origin);

    const { body: { statusCode } } = await fetch<PublishResponse>({
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

    logger.info(`[publish] [${catalog}] [${'uploaded'.green}] ${packagesPath}`, statusCode);
  }

  getPackageFileInfo({ filePath, extension, counter }: GetPackageFileInfoOptions): NexusPackageInfo | undefined {
    return;
  }

  async publishPackage(packageInfo: NexusPackageInfo, options: NexusPublisherOptions) {
  }
}
