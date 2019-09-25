export default interface PackageInfo {
    packageName: string;
    packageVersion?: string;
    registry?: string;
    index?: number;
    directoryPath?: string;
    filePath?: string;
    packagesPath?: string;
}
