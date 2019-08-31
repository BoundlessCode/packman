import path from 'path';
import fs from 'fs';
import { URL } from 'url';

import Command, { CommandExecuteOptions } from '../../../core/Command';
import { registryOption, directoryOption, catalogOption } from '../../../core/commandOptions';
import { fetch } from '../../../core/fetcher';
import downloadFileAsync from '../../../core/download-file';
import Cataloger from '../../../core/Cataloger';
import NugetPackageProvider from '../NugetPackageProvider';

export type NugetDownloadAllCommandOptions = CommandExecuteOptions & {
  registry: string
  directory: string
  catalogFile: string
}

type NugetIndexSearchResults = {
  version: string
}

type NugetServiceEntryResults = {
  count: number
  items: NugetPageInfo[]
}

type NugetPageInfo = {
  '@id': string
}

type NugetPageResults = {
  items: NugetItem[]
}

type NugetItem = {
  '@id': string
  'nuget:id': string
  'nuget:version': string
}

export default class NugetDownloadAllCommand implements Command {
  get definition() {
    return {
      name: 'all',
      description: 'download tarballs for all packages hosted by the registry',
      options: [
        registryOption,
        directoryOption,
        catalogOption,
      ],
    };
  }

  async execute(options: NugetDownloadAllCommandOptions) {
    const { logger, directory, catalogFile } = options;

    const provider = new NugetPackageProvider();
    const registry = await provider.getRegistry(options);

    const cataloger = catalogFile ? new Cataloger({ catalogFile: directory, logger }) : null;
    if (cataloger) {
      await cataloger.initialize();
    }

    const uri = new URL('v3/index.json', registry);
    const searchResults = await fetch<NugetIndexSearchResults>({ uri, responseType: 'json', logger });
    logger.info('nuget index version', searchResults ? searchResults.version : 'missing');
    const nugetClientVersion = "4.4.0";
    const catalogVersion = 'Catalog/3.0.0';
    const types = [
      catalogVersion,
      "http://schema.emgarten.com/sleet#Catalog/1.0.0",
    ];
    const indexUri = new URL(`v3/catalog0/index.json`, registry);
    const index: any = {
      [catalogVersion]: {
        "ClientVersion": "0.0.0",
        "Type": "Catalog/3.0.0",
        "Uri": indexUri.href,
      },
    };
    const type = types[0];
    const serviceEntry = index[type];
    const serviceEntryUri = serviceEntry.Uri;
    const pages = await fetch<NugetServiceEntryResults>({ uri: serviceEntryUri, responseType: 'json', logger });
    logger.info('pages:', pages && pages.count);
    for (const page of pages.items) {
      const pageUrl = page['@id'];
      const pageResults = await fetch<NugetPageResults>({ uri: pageUrl, responseType: 'json', logger });
      logger.info('page:', pageUrl, pageResults && pageResults.items && pageResults.items.length);
      pageResults.items.forEach(async (item) => {
        const itemUrl = item['@id'];
        const entryId = item['nuget:id'];
        const entryVersion = item['nuget:version'];
        const entryNameDisplay = `${entryId} ${entryVersion}`.yellow;
        const normalizedPackageId = entryId.toLowerCase();
        const normalizedVersion = entryVersion.toLowerCase();
        const packageInfo = {
          name: normalizedPackageId,
          version: normalizedVersion,
        };
        const installPath = path.join(directory, normalizedPackageId, normalizedVersion);
        const nupkgExtension = '.nupkg';
        const packageFileName = `${normalizedPackageId}.${normalizedVersion}${nupkgExtension}`;
        const packageFilePath = path.join(installPath, packageFileName);

        const itemLogger = logger.child({ package: packageFileName, path: packageFilePath });

        if (cataloger && cataloger.contains(packageInfo)) {
          itemLogger.info('skipping'.magenta, 'already cataloged', entryNameDisplay);
        }
        else if (fs.existsSync(packageFilePath)) {
          if (cataloger) {
            await cataloger.catalog(packageInfo);
          }
          itemLogger.info('skipping'.magenta, 'file exists', entryNameDisplay);
        }
        else {
          try {
            itemLogger.info('starting download:'.cyan, entryNameDisplay);
            const downloadOptions = {
              directory: installPath,
              filename: packageFileName,
              logger,
            };
            const { duration } = await downloadFileAsync(itemUrl, downloadOptions);
            if (cataloger) {
              await cataloger.catalog(packageInfo);
            }
            itemLogger.info('finished download'.green, `in ${duration}`, entryNameDisplay);
          }
          catch (error) {
            itemLogger.info('failed to download'.red, entryNameDisplay);
            itemLogger.error(error);
          }
        }
      });
    }
  }
}
