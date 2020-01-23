import semver from 'semver';

import { Logger } from '../../../core/logger';
import { execute } from '../../../core/shell';
import { Fetcher } from '../../../core/fetcher';
import { getPackageUrl, PackageResponse } from '../npm-utils';

export async function updateDistTagToLatest(registry: string, packageName: string, logger: Logger) {
    const childLogger = logger.child({ area: 'update dist-tag' });
    try {
        const { body: packageDetails } = await new Fetcher().fetch<PackageResponse>({
            uri: getPackageUrl({ registry, packageName }),
            responseType: 'json',
            logger,
        });
        const latest = semver.maxSatisfying(Object.keys(packageDetails.versions), '*');
        const prettyName = packageName.replace('%2F', '/');
        if (latest && latest !== packageDetails['dist-tags'].latest) {
            childLogger.info(`[${'latest dist'.cyan}] ${prettyName} ${latest}`);
            await execute(`npm dist-tag add ${prettyName}@${latest}`, { stdio: [0, 1, 2], logger: childLogger });
        }
        else {
            childLogger.info(`[${'skipping update dist'.yellow}] ${prettyName}`);
        }
    }
    catch (error) {
        childLogger.error(error);
    }
}
