import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import 'colors';

const execAsync = util.promisify(exec);

export async function execute(command, options) {
    const childLogger = options.logger.child({ area: 'shell execute' });
    childLogger.debug('executing command:', command);
    const { stdout, stderr } = await execAsync(command, options);
    if (stderr) {
        childLogger.error(`[${'error'.red}] ${command} ${stderr}}`);
        throw new Error(stderr.toString());
    }
    return stdout.toString().trim();
}

export function normalizeRootedDirectory(rootPath, { logger }) {
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
