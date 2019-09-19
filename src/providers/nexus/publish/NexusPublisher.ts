import { URL } from 'url';
import { createReadStream } from 'fs';

import Publisher, { PublisherOptions, GetPackageFileInfoOptions } from '../../../core/Publisher';
import { fetch } from '../../../core/fetcher';
import NexusPackageInfo from '../NexusPackageInfo';

type NexusPublisherOptions = PublisherOptions & {
  registry: string
  packagesPath: string
  uploadComponentUrl?: URL
}

type PublishResponse = {
  statusCode: number
}

export default class NexusPublisher extends Publisher<NexusPublisherOptions, NexusPackageInfo> {
  constructor(options: NexusPublisherOptions) {
    super(options);
  }

  async initializeOptions(options: NexusPublisherOptions) {
    const { origin } = new URL(options.registry);
    const uploadComponentUrl = new URL('/service/rest/beta/components', origin);

    return {
      uploadComponentUrl,
    };
  }

  getPackageFileInfo(options: GetPackageFileInfoOptions): NexusPackageInfo | undefined {
    return;
  }

  async publishPackage(packageInfo: NexusPackageInfo, options: NexusPublisherOptions) {
    const { uploadComponentUrl, lenientSsl, logger } = options;
    const { packagesPath } = packageInfo;

    if(!packagesPath) {
      logger.info(`missing packagesPath, cannot publish`);
      return;
    }

    if(!uploadComponentUrl) {
      logger.info(`missing uploadComponentUrl, cannot publish`);
      return;
    }

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
      lenientSsl,
      logger,
    });

    logger.info(`[publish] [${'uploaded'.green}] ${packagesPath}`, statusCode);
  }
}
