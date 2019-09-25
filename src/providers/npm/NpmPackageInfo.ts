import PackageInfo from '../../core/PackageInfo';

export default interface NpmPackageInfo extends PackageInfo {
  packageScope?: string;
}
