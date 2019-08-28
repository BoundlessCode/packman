import request from'request-promise';
import semver from'semver';

import { Logger, LoggerOptions } from'../../../core/logger';
import { execute } from'../../../core/shell';
import { getPackageUrl } from '../npm-utils';
import PackageInfo from '../../../core/PackageInfo';

type PackageVersionExistsOptions = LoggerOptions & {
    lenientSsl: boolean
}

export async function packageVersionExists(packageInfo: PackageInfo, { lenientSsl, logger }: PackageVersionExistsOptions) {
    const uri = getPackageUrl(packageInfo);
    try {
        logger.debug(`checking packageVersionExists, lenientSsl: ${lenientSsl}, uri: ${uri}`);
        const response = await request({
            uri,
            json: true,
            rejectUnauthorized: !lenientSsl, // https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature
        });
        const { packageVersion } = packageInfo;
        return packageVersion && (response.version === packageVersion || !!response.versions[packageVersion]);
    }
    catch (error) {
        logger.debug('package version exists error', { packageInfo, uri, error });
        return false;
    }
}

export async function updateDistTagToLatest(registry: string, packageName: string, logger: Logger) {
    const childLogger = logger.child({ area: 'update dist-tag' });
    try {
        const packageDetails = await request({ uri: getPackageUrl({ registry, packageName }), json: true });
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
