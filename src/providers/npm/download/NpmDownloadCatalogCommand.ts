import Command, { CommandExecuteOptions } from '../../../core/Command';
import { globalOptions, directoryOption, forceOption } from '../../../core/commandOptions';
import Cataloger, { EntryInfo } from '../../../core/Cataloger';
import { npmDownloadOptions, NpmDownloadCommandOptions } from '../npm-options';
import { getCurrentRegistry, getPackageUrl } from '../npm-utils';
import { downloadFromIterable } from './downloader';

export type NpmDownloadCatalogCommandOptions =
  NpmDownloadCommandOptions
  & CommandExecuteOptions
  & {
    directory: string
    catalogFile: string
    force: boolean
  };

export default class NpmDownloadCatalogCommand implements Command {
  get definition() {
    return {
      name: 'catalog',
      flags: '[catalogFile]',
      description: 'download tarballs for packages listed in the specified catalog file',
      options: [
        ...npmDownloadOptions,
        directoryOption,
        forceOption,
        ...globalOptions,
      ],
    };
  }

  async execute(options: NpmDownloadCatalogCommandOptions) {
    const { logger } = options;
    const registry = options.registry || await getCurrentRegistry(options);
    const cataloger = new Cataloger(options);
    logger.debug(`Using catalog file: ${cataloger.fullPath}`);
    if (cataloger.exists()) {
      await cataloger.initialize();
      const packages = Array.from(cataloger.stream((entry) => {
        const packageInfo = parsePackageInfo(entry, registry);
        const url = getPackageUrl(packageInfo);
        return url.href;
      }));
      return downloadFromIterable(packages, options.directory, options);
    }
    else {
      logger.info(`Could not find a catalog file at ${cataloger.fullPath}`);
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
