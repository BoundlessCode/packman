const { exec } = require('child_process');
const util = require('util');
const path = require('path');
require('colors');

const execAsync = util.promisify(exec);
async function execute(command, options) {
    const childLogger = options.logger.child({ area: 'shell execute' });
    childLogger.debug('executing command:', command);
    const { stdout, stderr } = await execAsync(command, options);
    if (stderr) {
        childLogger.error(`[${'error'.red}] ${command} ${stderr}}`);
        throw new Error(stderr);
    }
    return stdout.toString().trim();
}

function normalizeRootedDirectory(rootPath, { logger }) {
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

module.exports = {
    execute,
    normalizeRootedDirectory,
};
