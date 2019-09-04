import Command from '../../../core/Command';
import { GlobalOptions, globalOptions } from '../../../core/commandOptions';
import { EntryInfo } from '../../../core/catalog/types';
import Cataloger from '../../../core/catalog/Cataloger';
import { npmDownloadOptions, NpmDownloadOptions } from '../npm-options';
import { getCurrentRegistry, getPackageUrl } from '../npm-utils';
import { downloadFromIterable } from './downloader';

export type NpmDownloadCatalogCommandOptions =
  NpmDownloadOptions
  & GlobalOptions
  & {
    catalogFile: string
  };

export default class NpmDownloadCatalogCommand implements Command {
  get definition() {
    return {
      name: 'catalog',
      flags: '[catalogFile]',
      description: 'download tarballs for packages listed in the specified catalog file',
      options: [
        ...npmDownloadOptions,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadCatalogCommandOptions) {
    const { logger } = options;
    const registry = options.registry || await getCurrentRegistry(options);
    const cataloger = new Cataloger(options);
    logger.debug(`Using catalog file: ${cataloger.persister.target}`);
    if (cataloger.exists()) {
      await cataloger.initialize();
      const packages = cataloger.stream<string>((entry) => {
        const packageInfo = parsePackageInfo(entry, registry);
        const url = getPackageUrl(packageInfo);
        return url.href;
      });
      return downloadFromIterable(packages, options.directory, options);
    }
    else {
      logger.info(`Could not find a catalog file at ${cataloger.persister.target}`);
    }
  }
}

function parsePackageInfo(entry: EntryInfo, registry: string) {
  const { name: scopedName, version: packageVersion } = entry;

  const pattern = /(?:(.*)\/)?(.+)/g;
  const matches = pattern.exec(scopedName);
  // @ts-ignore Type 'RegExpExecArray | null' is not assignable to type '[undefined, string, string]'.
  let [, packageScope, packageName]: [undefined, string, string] = matches;

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
