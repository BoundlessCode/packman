import { LoggerOptions } from './logger';
import { collectPackagesByPath } from './collector';
import Counter from './counter';
import PackageInfo from './PackageInfo';

export type PublisherOptions = LoggerOptions & {
}

export type GetPackageFileInfoOptions = {
  filePath: string
  extension: string
  counter: Counter
}

export default abstract class Publisher<TOptions extends PublisherOptions> {
  constructor(protected options: TOptions) {
  }

  async collectAndPublishPackages(options) {
    const errors: string[] = [];
    const { logger } = options;

    for (const packageInfo of await collectPackagesByPath({
      ...options,
      getPackageFileInfo: this.getPackageFileInfo,
    })) {
      try {
        await this.publishPackage({ ...packageInfo, ...options });
      }
      catch (error) {
        const message: string = error && error.message ? error.message : error;
        logger.info('an error occurred while publishing'.red, packageInfo.filePath);
        errors.push(`[${packageInfo.index}] [${'error'.red}] ${packageInfo.packagesPath} ${message}`);
      }
    }

    if (errors.length > 0) {
      this.printErrors(errors);
      process.exit(1);
    }
  }

  abstract getPackageFileInfo(options: GetPackageFileInfoOptions);

  abstract async publishPackage(packageInfo: PackageInfo);

  printErrors(error: (string | Error)[] | Error  = []) {
    const { logger } = this.options;
    const errors =
      error instanceof Array
        ? error
        : [JSON.stringify(error), error.message || error];

    errors.forEach(error => logger.error(error as string));
  }
}
