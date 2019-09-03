export default interface PackageInfo {
    packageName: string;
    packageVersion?: string;
    packageScope?: string;
    registry?: string;
    index?: number;
    directoryPath?: string;
    filePath?: string;
    architecture?: string;
}
