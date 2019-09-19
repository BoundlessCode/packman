import { LoggerOptions } from './logger';
import { collectFilePaths, CollectFileOptions } from './collector';
import Counter from './counter';
import PackageInfo from './PackageInfo';
import { SslOptions } from './commandOptions';

export type PublisherOptions =
  LoggerOptions
  & SslOptions
  & {
    alternatePublish?: (options: any) => Promise<any>
  }

export type GetPackageFileInfoOptions = {
  filePath: string
  extension: string
  counter: Counter
}

export default abstract class Publisher<TOptions extends PublisherOptions, TPackageInfo extends PackageInfo> {
  constructor(protected options: TOptions) {
  }

  async publish() {
    const options: TOptions = {
      ...this.options,
      ...await this.initializeOptions(this.options),
    };

    if(options.alternatePublish) {
      await options.alternatePublish(options);
    }
    else {
      await this.collectAndPublishPackages(options);
    }
  }

  async abstract initializeOptions(options: TOptions): Promise<any>;

  async collectAndPublishPackages(options) {
    const errors: string[] = [];
    const { logger } = options;

    const packageInfos: Iterable<TPackageInfo> = this.collectPackagesByPath(options);

    for (const packageInfo of packageInfos) {
      try {
        await this.publishPackage(packageInfo, options);
      }
      catch (error) {
        const errorMessage: string = (error && error.message ? error.message : error).red;
        const packageSummary = `[${packageInfo.index}] ${(packageInfo.filePath || '').yellow}`;
        const message = `${'failed to publish'.red} ${packageSummary} because '${errorMessage}'`;
        logger.info(message);
        errors.push(`[${'error'.red}] ${message}`);
      }
    }

    if (errors.length > 0) {
      this.printErrors(errors);
      process.exit(1);
    }
  }

  * collectPackagesByPath(options: CollectFileOptions): Iterable<TPackageInfo> {
    const { logger } = options;

    const counter = new Counter();

    const filePaths = collectFilePaths(options);

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
