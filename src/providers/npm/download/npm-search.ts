import request from 'request-promise';
import NpmPackageProvider from '../NpmPackageProvider';

type GeneratePackageJsonOptions = {
  keyword: string
  registry: string
}

export async function generatePackageJson(options: GeneratePackageJsonOptions) {
  const provider = new NpmPackageProvider();
  const { keyword, registry = provider.defaultRegistry } = options;
  const uri = `${registry}/-/v1/search?text=keywords:${keyword}&size=1000`;
  const response = await request({ uri, json: true });

  const packageJson = response.objects.reduce((prev, curr) => {
    prev.dependencies[curr.package.name] = curr.package.version;
    return prev;
  }, { dependencies: {} });

  return packageJson;
}
