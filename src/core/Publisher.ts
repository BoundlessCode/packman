import { LoggerOptions } from './logger';
import { collectFilePaths, CollectFileOptions } from './collector';
import Counter from './counter';
import PackageInfo from './PackageInfo';
import { SslOptions, TimeoutOption } from './commandOptions';
import { generateFileName } from './generators';
import Cataloger from './catalog/Cataloger';
import { DEFAULT_CATALOG_FILE_NAME } from './catalog/FileCatalogPersister';

export type PublisherOptions =
  LoggerOptions
  & SslOptions
  & {
    alternatePublish?: (data: unknown, options: unknown) => Promise<unknown>
    failureCatalog?: string
  }

export const publisherOptions =
  [
    {
      flags: '--failure-catalog [failureCatalog]',
      description: 'outputs failed packages to a catalog file with the optionally specified file name',
    },
  ];

export type PackageVersionExistsOptions =
  LoggerOptions
  & SslOptions
  & TimeoutOption
  & {
  }

export type GetPackageFileInfoOptions = {
  filePath: string
  extension: string
  counter: Counter
}

export type PublishErrorHandler = (message: string, packageInfo: PackageInfo) => void
export type PublishErrorHandlerList = PublishErrorHandler[]

export default abstract class Publisher<TOptions extends PublisherOptions, TPackageInfo extends PackageInfo> {
  constructor(protected options: TOptions) {
  }

  async publish() {
    const options: TOptions = {
      ...this.options,
      ...await this.initializeOptions(this.options),
    };

    if(options.alternatePublish) {
      await options.alternatePublish(undefined, options);
    }
    else {
      await this.collectAndPublishPackages(options);
    }
  }

  async abstract initializeOptions(options: TOptions): Promise<any>;

  async collectAndPublishPackages(options) {
    const errors: string[] = [];
    const errorHandlers: PublishErrorHandlerList = [];
    this.initializePublishErrorHandlers(errorHandlers, { ...options, errors });

    const collectPackages: (options: TOptions) => Iterable<TPackageInfo> = options.collectPackages || this.collectPackagesByPath.bind(this);
    const packageInfos: Iterable<TPackageInfo> = collectPackages(options);

    for (const packageInfo of packageInfos) {
      try {
        await this.publishPackage(packageInfo, options);
      }
      catch (error) {
        const errorMessage: string = (error && error.message ? error.message : error).red;
        const packageSummary = `[${packageInfo.index}] ${(packageInfo.filePath || '').yellow}`;
        const message = `${'failed to publish'.red} ${packageSummary} because '${errorMessage}'`;
        errorHandlers.forEach(errorHandler => errorHandler(message, packageInfo));
      }
    }

    if (errors.length > 0) {
      this.printErrors(errors);
      process.exit(1);
    }
  }

  initializePublishErrorHandlers(errorHandlers: PublishErrorHandlerList, options) {
    const { logger } = options;
    errorHandlers.push((message) => logger.info(message));

    const { errors } = options;
    errorHandlers.push((message) => errors.push(`[${'error'.red}] ${message}`));

    const { failureCatalog } = options;
    logger.debug(`===> failureCatalog: ${failureCatalog}`);
    if(failureCatalog) {
      const failureCataloger = new Cataloger({
        logger,
        catalogFile: failureCatalog === true ? generateFileName(`failed-%DATE%${DEFAULT_CATALOG_FILE_NAME}`) : failureCatalog,
      });
      errorHandlers.push((_, packageInfo) => failureCataloger.catalog({
        name: packageInfo.packageName,
        version: packageInfo.packageVersion || packageInfo.filePath || '',
      }));
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
