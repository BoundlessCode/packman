const NpmDownloadFromGeneratedCommand = require('./NpmDownloadFromGeneratedCommand');
const NpmDownloadGenerateCommand = require('./NpmDownloadGenerateCommand');
const NpmDownloadAllCommand = require('./NpmDownloadAllCommand');
const NpmDownloadSearchCommand = require('./NpmDownloadSearchCommand');
const NpmDownloadPackageJsonCommand = require('./NpmDownloadPackageJsonCommand');
const NpmDownloadPackageCommand = require('./NpmDownloadPackageCommand');
const NpmDownloadPackageLockCommand = require('./NpmDownloadPackageLockCommand');

/**
 * @param {string} uri
 * @param {{ directory: string }} options
 */
async function packageLockCommand(uri, options) {
  const command = new NpmDownloadPackageLockCommand(uri, options);
  return await command.execute();
}

/**
 * @param {string} name
 * @param {string} version
 * @param {{ directory: string, devDependencies: boolean, peerDependencies: boolean, registry: string }} options
 */
async function packageCommand(name, version, options) {
  const command = new NpmDownloadPackageCommand(name, version, options);
  return await command.execute();
}

/**
 * @param {string} uri
 * @param {{ directory: string, devDependencies: boolean, peerDependencies: boolean, registry: string }} options
 */
async function packageJsonCommand(uri, options) {
  const command = new NpmDownloadPackageJsonCommand(uri, options);
  return await command.execute();
}

/**
* @param {string} keyword
* @param {{ directory: string, devDependencies: boolean, peerDependencies: boolean, registry: string }} options
*/
async function searchCommand(keyword, options) {
  const command = new NpmDownloadSearchCommand(keyword, options);
  return await command.execute();
}

/**
* @param {{ directory: string, registry: string }} options
*/
async function allCommand(options) {
  const command = new NpmDownloadAllCommand(options);
  return await command.execute();
}

/**
* @param {string} keyword
* @param {{ outputFile: string, devDependencies: boolean, peerDependencies: boolean }} options
*/
async function generateCommand(name, version, options) {
  const command = new NpmDownloadGenerateCommand(name, version, options);
  return await command.execute();
}

/**
 * @param { string } uri 
 * @param {{ directory: string }} options 
 */
async function fromGeneratedCommand(uri, options) {
  const command = new NpmDownloadFromGeneratedCommand(uri, options);
  return await command.execute();
}

module.exports = {
  packageLockCommand,
  packageCommand,
  packageJsonCommand,
  searchCommand,
  allCommand,
  generateCommand,
  fromGeneratedCommand
};
