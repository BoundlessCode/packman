import semver from 'semver';

import { Logger, LoggerOptions } from '../../../core/logger';
import { execute } from '../../../core/shell';
import { fetch } from '../../../core/fetcher';
import { getPackageUrl } from '../npm-utils';
import PackageInfo from '../../../core/PackageInfo';

type PackageVersionExistsOptions = LoggerOptions & {
    lenientSsl?: boolean
}

type PackageResponse = {
    version: string
    versions: string[]
    'dist-tags': {
        latest: string
    }
}

export async function packageVersionExists(packageInfo: PackageInfo, { lenientSsl = false, logger }: PackageVersionExistsOptions) {
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
        return packageVersion && (version === packageVersion || !!versions[packageVersion]);
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

export async function updateDistTagToLatest(registry: string, packageName: string, logger: Logger) {
    const childLogger = logger.child({ area: 'update dist-tag' });
    try {
        const { body: packageDetails } = await fetch<PackageResponse>({
            uri: getPackageUrl({ registry, packageName }),
            responseType: 'json',
            logger,
        });
        const latest = semver.maxSatisfying(Object.keys(packageDetails.versions), '*');
        const prettyName = packageName.replace('%2F', '/');
        if (latest && latest !== packageDetails['dist-tags'].latest) {
            childLogger.info(`[${'latest dist'.cyan}] ${prettyName} ${latest}`);
            await execute(`npm dist-tag add ${prettyName}@${latest}`, { stdio: [0, 1, 2], childLogger });
        }
        else {
            childLogger.info(`[${'skipping update dist'.yellow}] ${prettyName}`);
        }
    }
    catch (error) {
        childLogger.error(error);
    }
}
