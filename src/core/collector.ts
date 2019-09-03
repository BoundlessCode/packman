import fs from 'fs';
import path from 'path';
import glob from 'glob';

import { LoggerOptions } from '../core/logger';

export type CollectFileOptions = LoggerOptions & {
    rootPath: string
    extension: string
}

export function collectFilePaths({ rootPath, logger, extension }: CollectFileOptions) {
    const stat = fs.lstatSync(rootPath);

    const filePaths: string[] = [];
    if (stat.isFile()) {
        filePaths.push(rootPath);
    }
    else {
        const pattern = path.join(rootPath, '**', `*${extension}`);
        filePaths.push(...glob.sync(pattern));
    }

    logger.debug('list of files to collect', filePaths);
    return filePaths;
}
