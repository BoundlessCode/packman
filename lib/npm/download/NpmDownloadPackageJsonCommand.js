const Command = require('../../core/Command');
const { commonPackageOptions } = require('../../core/commandOptions');
const { retrieveFile } = require('../../core/uri-retriever');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadPackageJsonCommand extends Command {
  get definition() {
    return {
      name: 'package-json <uri>',
      description: 'download tarballs based on a package.json',
      options: [
        ...commonPackageOptions,
      ],
      action: (uri, command) => this.execute({ uri, ...command }),
    };
  }

  async execute(options = {}) {
    const { uri } = options;
    const packageJson = await retrieveFile(uri);
    const tarballsSet = await crawler.getPackageJsonDependencies({
      packageJson,
      devDependencies: options.devDependencies,
      peerDependencies: options.peerDependencies,
      registry: options.registry,
    });
    return downloader.downloadFromIterable(tarballsSet, options.directory);
  }
}

module.exports = NpmDownloadPackageJsonCommand;
