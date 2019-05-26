const { exec } = require('child_process');
const util = require('util');
require('colors');

const execAsync = util.promisify(exec);
async function execute(command, options) {
    let { stdout, stderr } = await execAsync(command, options);
    if (stderr) {
        console.log(`[${'error'.red}] ${command} ${stderr}}`);
        throw new Error(stderr);
    }
    return stdout.toString().trim();
}

module.exports = {
    execute
};
