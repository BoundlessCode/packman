const NugetDownloadAllCommand = require('./NugetDownloadAllCommand');

/**
* @param {{ directory: string, registry: string }} options
*/
async function allCommand(options) {
  const command = new NugetDownloadAllCommand(options);
  return await command.execute();
}

module.exports = {
  allCommand,
};
