const Command = require('../../../core/Command');
const { globalOptions, registryOption, directoryOption, forceOption } = require('../../../core/commandOptions');
const Cataloger = require('../../../core/Cataloger');
const { getCurrentRegistry, getPackageUrl } = require('../npm-utils');
const downloader = require('./downloader');

class NpmDownloadCatalogCommand extends Command {
  get definition() {
    return {
      name: 'catalog',
      flags: '[catalogFile]',
      description: 'download tarballs for packages listed in the specified catalog file',
      options: [
        registryOption,
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options = {}) {
    const { catalogFile, force, logger } = options;
    const registry = options.registry || await getCurrentRegistry({ logger });
    const cataloger = new Cataloger({ catalogFile, logger });
    logger.debug(`Using catalog file: ${cataloger.fullPath}`);
    if (cataloger.exists()) {
      await cataloger.initialize();
      const packages = Array.from(cataloger.stream((entry) => {
        const packageInfo = parsePackageInfo(entry, registry);
        const url = getPackageUrl(packageInfo);
        return url.href;
      }));
      return downloader.downloadFromIterable(packages, options.directory, { force, logger });
    }
    else {
      logger.info(`Could not find a catalog file at ${cataloger.fullPath}`);
    }
  }
}

function parsePackageInfo (entry, registry) {
  const { name: scopedName, version: packageVersion } = entry;

  const pattern = /(?:(.*)\/)?(.+)/g;
  const matches = pattern.exec(scopedName);
  let [, packageScope, packageName] = matches;

  if (packageScope && !packageScope.startsWith('@')) {
    packageScope = '@' + packageScope;
  }

  const packageInfo = {
    packageScope,
    packageName,
    packageVersion,
    registry,
  };
  return packageInfo;
}

module.exports = NpmDownloadCatalogCommand;
