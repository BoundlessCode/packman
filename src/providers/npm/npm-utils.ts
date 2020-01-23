import { URL } from 'url';
import validate from 'validate-npm-package-name';
import path from 'path';

import { LoggerOptions } from '../../core/logger';
import { execute } from '../../core/shell';
import PackageInfo from '../../core/PackageInfo';
import { Fetcher } from '../../core/fetcher';
import { PackageVersionExistsOptions } from '../../core/Publisher';
import NpmPackageInfo from './NpmPackageInfo';

export const TARBALL_EXTENSION = 'tgz';

export async function getCurrentRegistry({ logger }: LoggerOptions) {
    return await execute('npm get registry', { logger });
}

export function getScopedPackageName({ packageName, packageScope }: NpmPackageInfo) {
    return packageScope ? `${packageScope}/${packageName}` : packageName;
}

export function getVersionedPackageName({ packageName, packageScope, packageVersion }: NpmPackageInfo) {
    const scopedName = getScopedPackageName({ packageName, packageScope })
    return packageVersion ? `${scopedName}/${packageVersion}` : scopedName;
}

export function getPackageUrl(packageInfo: NpmPackageInfo) {
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

export type PackageResponse = {
    version: string
    versions: string[]
    'dist-tags': {
        latest: string
    }
}

export async function packageVersionExists(packageInfo: PackageInfo, { timeout, lenientSsl = false, logger }: PackageVersionExistsOptions): Promise<boolean> {
    const { packageName, packageVersion = '' } = packageInfo;
    logger.debug(`packageVersionExists: packageInfo:`, packageInfo);
    const uri = getPackageUrl(packageInfo);
    try {
        logger.debug(`checking packageVersionExists, lenientSsl: ${lenientSsl}, uri: ${uri}`);
        const fetcher = new Fetcher({
            lenientSsl,
        });
        const { body: { version, versions } } = await fetcher.fetch<PackageResponse>({
            uri,
            responseType: 'json',
            timeout,
            logger,
        });
        return !!packageVersion && (version === packageVersion || !!versions[packageVersion]);
    }
    catch (error) {
        const statusCode = error.statusCode || (error.response && error.response.status);
        if (statusCode === 404) {
            logger.debug(`the package ${packageName.cyan}@${(packageVersion || '').cyan} could not be found at ${uri}`.yellow);
            return false;
        }
        logger.debug('package version exists error', { packageInfo, uri, statusCode, error });
        throw error;
    }
}

export type GetPackageFileInfoOptions = {
    filePath: string
    extension: string
}

export function getPackageFileInfo({ filePath, extension }: GetPackageFileInfoOptions): NpmPackageInfo | undefined {
    const fileInfo = path.parse(filePath);

    if (fileInfo.ext === extension) {
        const directoryPath = fileInfo.dir;
        const directoryParts = directoryPath.split(path.posix.sep);

        const parentDirectory = directoryParts.pop() || '';
        const grandparentDirectory = directoryParts.pop() || '';

        const packageScope =
            parentDirectory.startsWith('@')
                ? parentDirectory
                : (
                    grandparentDirectory.startsWith('@') ? grandparentDirectory : undefined
                );

        const fileName = fileInfo.name;

        // The pattern is loosely based on the recommended semver version matching pattern
        // but gets rid of the unnecessary capture groups for the different parts of a version strings
        // and captures the scope and package name at the beginning of the string.
        //
        // The scope is optional so this pattern ensures that the result array always has the same number
        // of items, with or without scope.
        //
        // Finally, the fileName does not currently support scope, so it's currently only captured in
        // preparation for future changes.
        //
        // See https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
        // and https://regex101.com/r/EanOyJ/1
        const pattern = /(?:\@(.*)\/|)(.*)\-((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)/g;
        const matches = pattern.exec(fileName);
        const [, /* scope */, packageName, packageVersion] = matches;

        return {
            directoryPath,
            filePath,
            packageName,
            packageVersion,
            packageScope,
        };
    };
}
