import { LoggerOptions } from './logger';
import { collectFilePaths, CollectFileOptions } from './collector';
import Counter from './counter';
import PackageInfo from './PackageInfo';

export type PublisherOptions = LoggerOptions & {
}

export type GetPackageFileInfoOptions = {
  filePath: string
  extension: string
  counter: Counter
}

export default abstract class Publisher<TOptions extends PublisherOptions, TPackageInfo extends PackageInfo> {
  constructor(protected options: TOptions) {
  }

  async collectAndPublishPackages(options) {
    const errors: string[] = [];
    const { logger } = options;

    const packageInfos: Iterable<TPackageInfo> = this.collectPackagesByPath(options);

    for (const packageInfo of packageInfos) {
      try {
        await this.publishPackage(packageInfo, options);
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

  * collectPackagesByPath(options: CollectFileOptions): Iterable<TPackageInfo> {
    const { rootPath, logger, extension } = options;

    const counter = new Counter();

    const filePaths = collectFilePaths({ rootPath, logger, extension });

    for (const filePath of filePaths) {
      logger.debug('collecting', filePath);

      const packageFileInfo = this.getPackageFileInfo({ ...options, filePath, counter });
      if (packageFileInfo) {
        yield packageFileInfo;
      }
    }
  }

  abstract getPackageFileInfo(options: GetPackageFileInfoOptions): TPackageInfo | undefined;

  abstract async publishPackage(packageInfo: TPackageInfo, options: TOptions);

  printErrors(error: (string | Error)[] | Error = []) {
    const { logger } = this.options;
    const errors =
      error instanceof Array
        ? error
        : [JSON.stringify(error), error.message || error];

    errors.forEach(error => logger.error(error as string));
  }
}
