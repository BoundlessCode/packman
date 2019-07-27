const { exec } = require('child_process');
const util = require('util');
const path = require('path');
require('colors');

const execAsync = util.promisify(exec);
async function execute(command, options) {
    const childLogger = options.logger.child({ area: 'shell execute' });
    let { stdout, stderr } = await execAsync(command, options);
    if (stderr) {
        childLogger.error(`[${'error'.red}] ${command} ${stderr}}`);
        throw new Error(stderr);
    }
    return stdout.toString().trim();
}

function normalizeRootedDirectory(rootPath) {
    return path.isAbsolute(rootPath)
        ? rootPath
        : path.join(process.cwd(), rootPath);
}

module.exports = {
    execute,
    normalizeRootedDirectory,
};
