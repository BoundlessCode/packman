const path = require('path');
const fs = require('fs');

const Command = require('../../core/Command');
const { registryOption, directoryOption, catalogOption } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const downloadFileAsync = require('../../core/download-file');
const Cataloger = require('../../core/Cataloger');
const NugetPackageProvider = require('../NugetPackageProvider');

class NugetDownloadAllCommand extends Command {
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

  async execute(options = {}) {
    const { logger, directory, catalog } = options;

    const provider = new NugetPackageProvider();
    const registry = await provider.getRegistry({ options });

    const cataloger = catalog ? new Cataloger({ indexFile: directory, logger }) : null;
    if (catalog) {
      await cataloger.initialize();
    }

    const uri = new URL('v3/index.json', registry);
    const searchResults = await retrieveFile(uri, { json: true, logger });
    logger.info('nuget index version', searchResults ? searchResults.version : 'missing');
    const nugetClientVersion = "4.4.0";
    const types = [
      "Catalog/3.0.0",
      "http://schema.emgarten.com/sleet#Catalog/1.0.0",
    ];
    const indexUri = new URL(`v3/catalog0/index.json`, registry);
    const index = {
      "Catalog/3.0.0": {
        "ClientVersion": "0.0.0",
        "Type": "Catalog/3.0.0",
        "Uri": indexUri.href,
      },
    };
    const serviceEntry = index[types[0]];
    const serviceEntryUri = serviceEntry.Uri;
    const pages = await retrieveFile(serviceEntryUri, { json: true, logger });
    logger.info('pages:', pages && pages.count);
    for (const page of pages.items) {
      const pageUrl = page['@id'];
      const pageResults = await retrieveFile(pageUrl, { json: true, logger });
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

        if (cataloger.contains(packageInfo)) {
          itemLogger.info('skipping'.magenta, 'already cataloged', entryNameDisplay);
        }
        else if (fs.existsSync(packageFilePath)) {
          if (catalog) {
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
            };
            const { duration } = await downloadFileAsync(itemUrl, downloadOptions);
            if (catalog) {
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

module.exports = NugetDownloadAllCommand;
