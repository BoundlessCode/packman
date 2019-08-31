import { LoggerOptions } from '../../../core/logger';
import { fetch } from '../../../core/fetcher';
import NpmPackageProvider from '../NpmPackageProvider';

type GeneratePackageJsonOptions = LoggerOptions & {
  keyword: string
  registry: string
}

type Package = {
  package: {
    name: string
    version: string
  }
}

type PackageJson = {
  dependencies: {
    [key: string]: string
  }
}

type PackageJsonResponse = {
  objects: Package[]
}

export async function generatePackageJson(options: GeneratePackageJsonOptions) {
  const provider = new NpmPackageProvider();
  const { keyword, registry = provider.defaultRegistry, logger } = options;
  const url = `${registry}/-/v1/search?text=keywords:${keyword}&size=1000`;
  logger.info('searching', url.blue);

  const response = await fetch<PackageJsonResponse>({
    url,
    json: true,
    logger,
  });

  const packageJson = response.objects.reduce<PackageJson>((prev, curr) => {
    prev.dependencies[curr.package.name] = curr.package.version;
    return prev;
  }, { dependencies: {} });

  return packageJson;
}
