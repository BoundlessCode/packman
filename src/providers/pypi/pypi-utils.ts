import path from 'path';

import PypiPackageInfo from './PypiPackageInfo';

export const WHEEL_EXTENSION = 'whl';

export type GetPackageFileInfoOptions = {
    filePath: string
    extension: string
}

export function getPackageFileInfo({ filePath, extension }: GetPackageFileInfoOptions): PypiPackageInfo | undefined {
    const fileInfo = path.parse(filePath);

    if (fileInfo.ext === extension) {
        const directoryPath = fileInfo.dir;

        const fileName = fileInfo.name;
        const parts = fileName.split('-');
        const [packageName, packageVersion] = parts;

        return {
            directoryPath,
            filePath,
            packageName,
            packageVersion,
        };
    };
}
