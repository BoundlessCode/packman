import fs from 'fs';
import path from 'path';
import glob from 'glob';

import { LoggerOptions } from '../core/logger';
import Counter from './counter';

type CollectFileOptions = LoggerOptions & {
    rootPath: string
    extension: string
}

type CollectCallbackOptions = {
    getPackageFileInfo: ({ filePath: string, counter: Counter }) => any
}

export function* collectPackagesByPath(options: CollectFileOptions & CollectCallbackOptions) {
    const { rootPath, logger, extension, getPackageFileInfo } = options;

    const counter = new Counter();

    const filePaths = collectFilePaths({ rootPath, logger, extension });

    for (const filePath of filePaths) {
        logger.debug('collecting', filePath);

        yield getPackageFileInfo({ ...options, filePath, counter });
    }
}

function collectFilePaths({ rootPath, logger, extension }: CollectFileOptions) {
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
