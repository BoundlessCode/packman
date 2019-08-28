import { URL } from 'url';
import validate from 'validate-npm-package-name';

import { LoggerOptions } from '../../core/logger';
import { execute } from '../../core/shell';
import PackageInfo from '../../core/PackageInfo';

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
