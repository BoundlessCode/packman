const path = require('path');
const fs = require('fs');

const Command = require('../../core/Command');
const log = require('../../core/logger');
const { retrieveFile } = require('../../core/uri-retriever');
const downloadFileAsync = require('../../core/download-file');
const { provider } = require('../NugetPackageProvider');

class NugetDownloadAllCommand extends Command {
  constructor(options = {}) {
    this.options = options;
  }

  async execute() {
    console.log('options', options);
    const registry = options.registry || provider.defaultRegistry; // || await getCurrentRegistry();
    const url = new URL('v3/index.json', registry);
    const searchResults = await retrieveFile(url, { json: true });
    console.log('searchResults', searchResults);
    const nugetClientVersion = "4.4.0";
    const types = [
      "Catalog/3.0.0",
      "http://schema.emgarten.com/sleet#Catalog/1.0.0",
    ];
    const index = {
      "Catalog/3.0.0": {
        "ClientVersion": "0.0.0",
        "Type": "Catalog/3.0.0",
        "Uri": "https://api.nuget.org/v3/catalog0/index.json",
      },
    };
    const serviceEntry = index[types[0]];
    const serviceEntryUri = serviceEntry.Uri;
    const pages = await retrieveFile(serviceEntryUri, { json: true });
    console.log('result2', pages);
    for (const page of pages.items) {
      const pageUrl = page['@id'];
      const pageResults = await retrieveFile(pageUrl, { json: true });
      console.log('page', pageUrl, pageResults);
      pageResults.items.forEach(async (item) => {
        const itemUrl = item['@id'];
        const entryId = item['nuget:id'];
        const entryVersion = item['nuget:version'];
        const normalizedPackageId = entryId.toLowerCase();
        const normalizedVersion = entryVersion.toLowerCase();
        const installPath = path.join(options.directory, normalizedPackageId, normalizedVersion);
        const nupkgExtension = '.nupkg';
        const packageFileName = `${normalizedPackageId}.${normalizedVersion}${nupkgExtension}`;
        const packageFilePath = path.join(installPath, packageFileName);
        if (fs.existsSync(packageFilePath)) {
          log(['nuget', 'download', 'skipping'.magenta, 'file exists'], packageFilePath);
        }
        else {
          try {
            log(['nuget', 'download', 'starting'.cyan, packageFileName], packageFilePath);
            const downloadOptions = {
              directory: installPath,
              filename: packageFileName,
            };
            const { duration } = await downloadFileAsync(itemUrl, downloadOptions);
            log(['nuget', 'download', 'finished'.green, packageFileName, `in ${duration}`], packageFilePath);
          }
          catch (error) {
            log(['nuget', 'download', 'error'.red, packageFileName], packageFilePath, error);
          }
        }
      });
    }
  }
}

module.exports = NugetDownloadAllCommand;
