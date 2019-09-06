import { URL } from 'url';
import validate from 'validate-npm-package-name';
import path from 'path';

import { LoggerOptions } from '../../core/logger';
import { execute } from '../../core/shell';
import PackageInfo from '../../core/PackageInfo';
import { fetch } from '../../core/fetcher';
import NpmPackageInfo from './NpmPackageInfo';

export const TARBALL_EXTENSION = 'tgz';

export async function getCurrentRegistry({ logger }: LoggerOptions) {
    return await execute('npm get registry', { logger });
}

export function getScopedPackageName({ packageName, packageScope }: PackageInfo) {
    return packageScope ? `${packageScope}/${packageName}` : packageName;
}

export function getVersionedPackageName({ packageName, packageScope, packageVersion }: PackageInfo) {
    const scopedName = getScopedPackageName({ packageName, packageScope })
    return packageVersion ? `${scopedName}/${packageVersion}` : scopedName;
}

export function getPackageUrl(packageInfo: PackageInfo) {
    const fullName = getVersionedPackageName(packageInfo);
    return new URL(fullName, packageInfo.registry);
}

export function isValidPackageName(name: string) {
    const result = validate(name);
    return result.validForNewPackages || result.validForOldPackages;
}

export function getAllEndpointUrl(registry: string, { logger }) {
    // do not add the initial '/' because it will resolve incorrectly when using the URL ctor
    const NPM_ALL_ENDPOINT = '-/all';
    const url = new URL(NPM_ALL_ENDPOINT, registry);
    logger.debug(`all endpoint located at ${url}`);
    return url;
}

type PackageVersionExistsOptions =
    LoggerOptions
    & {
        lenientSsl?: boolean
    }

export type PackageResponse = {
    version: string
    versions: string[]
    'dist-tags': {
        latest: string
    }
}

export async function packageVersionExists(packageInfo: PackageInfo, { lenientSsl = false, logger }: PackageVersionExistsOptions): Promise<boolean> {
    const { packageName, packageVersion = '' } = packageInfo;
    const uri = getPackageUrl(packageInfo);
    try {
        logger.debug(`checking packageVersionExists, lenientSsl: ${lenientSsl}, uri: ${uri}`);
        const { body: { version, versions } } = await fetch<PackageResponse>({
            uri,
            responseType: 'json',
            rejectUnauthorized: !lenientSsl,
            logger,
        });
        return !!packageVersion && (version === packageVersion || !!versions[packageVersion]);
    }
    catch (error) {
        if (error.statusCode && error.statusCode === 404) {
            logger.debug(`the package ${packageName.cyan}@${(packageVersion || '').cyan} could not be found at ${uri}`.yellow);
            return false;
        }
        logger.debug('package version exists error', { packageInfo, uri: uri, error });
        throw error;
    }
}

export type GetPackageFileInfoOptions = {
    filePath: string
    extension: string
}

export function getPackageFileInfo({ filePath, extension }: GetPackageFileInfoOptions): NpmPackageInfo | undefined {
    const fileInfo = path.parse(filePath);

    if (fileInfo.ext === `.${extension}`) {
      const directoryPath = fileInfo.dir;
      const directoryParts = directoryPath.split(path.posix.sep);

      const packageName = directoryParts.pop();

      if (!packageName) {
        throw new Error(`could not extract package name from directoryPath ${directoryPath}`);
      }

      const potentialScope = directoryParts.pop() || '';
      const packageScope = potentialScope.startsWith('@') ? potentialScope : undefined;

      const fileName = fileInfo.name;
      const packageVersion = fileName.slice(fileName.lastIndexOf('-') + 1);

      return {
        directoryPath,
        filePath,
        packageName,
        packageVersion,
        packageScope,
      };
    }
}
