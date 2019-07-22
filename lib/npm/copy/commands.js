const NpmCopyAllCommand = require('./NpmCopyAllCommand');
const NpmCopySearchCommand = require('./NpmCopySearchCommand');
const NpmCopyPackageJsonCommand = require('./NpmCopyPackageJsonCommand');
const NpmCopyPackageLockCommand = require('./NpmCopyPackageLockCommand');
const NpmCopyPackageCommand = require('./NpmCopyPackageCommand');

/**
 * @param {string} name
 * @param {string} version
 * @param {{ source: string, target: string, directory: string }} options
 */
async function copyPackageCommand(name, version, options) {
  const command = new NpmCopyPackageCommand(name, version, options);
  return await command.execute();
}

/**
 * @param {string} uri
 * @param {{ target: string, directory: string }} options
 */
async function copyPackageLockCommand(uri, options) {
  const command = new NpmCopyPackageLockCommand(uri, options);
  return await command.execute();
}

/**
 * @param {string} uri
 * @param {{ source: string, target: string, directory: string, devDependencies: boolean, peerDependencies: boolean }} options
 */
async function copyPackageJsonCommand(uri, options) {
  const command = new NpmCopyPackageJsonCommand(uri, options);
  return await command.execute();
}

/**
 * @param {string} keyword
 * @param {{ source: string, target: string, directory: string, devDependencies: boolean, peerDependencies: boolean }} options
 */
async function copySearchCommand(keyword, options) {
  const command = new NpmCopySearchCommand(keyword, options);
  return await command.execute();
}

/**
 * @param {{ source: string, target: string, directory: string }} options
 */
async function copyAllCommand(options) {
  const command = new NpmCopyAllCommand(options);
  return await command.execute();
}

module.exports = {
  copyPackageCommand,
  copyPackageLockCommand,
  copyPackageJsonCommand,
  copySearchCommand,
  copyAllCommand,
};
