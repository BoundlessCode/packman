import { exec, ExecOptions } from 'child_process';
import util from 'util';
import path from 'path';
import 'colors';

import { LoggerOptions } from './logger';

const execAsync = util.promisify(exec);

type ShellExecuteOptions =
    LoggerOptions
    & ExecOptions
    & {
        stdio?: number[]
    }

export async function execute(command: string, options: ShellExecuteOptions) {
    const childLogger = options.logger.child({ area: 'shell execute' });
    childLogger.debug('executing command:', command);
    const { stdout, stderr } = await execAsync(command, options);
    if (stderr) {
        childLogger.error(`[${'error'.red}] ${command} ${stderr}}`);
        throw new Error(stderr.toString());
    }
    return stdout.toString().trim();
}

export function normalizeRootedDirectory(rootPath: string, { logger }: LoggerOptions) {
    logger.debug('normalizing rooted directory:', rootPath);

    if(path.isAbsolute(rootPath)) {
        logger.debug(`${rootPath} is an absolute path, returning it`);
        return rootPath;
    }
    else {
        logger.debug(`${rootPath} is not an absolute path, returning path relative to cwd`);
        const cwd = process.cwd();
        logger.debug('cwd', cwd);
        return path.join(cwd, rootPath);
    }
}
