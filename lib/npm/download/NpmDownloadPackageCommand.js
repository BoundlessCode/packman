const Command = require('../../core/Command');
const { commonPackageOptions } = require('../../core/commandOptions');
const crawler = require('./crawler');
const downloader = require('./downloader');

class NpmDownloadPackageCommand extends Command {
  get definition() {
    return {
      name: 'package <name> [version]',
      description: 'download tarballs based on a package and a version',
      options: [
        ...commonPackageOptions,
      ],
      action: (name, version, command) => this.execute({ name, version, ...command }),
    };
  }

  async execute(options = {}) {
    const {
      name,
      version,
      devDependencies,
      peerDependencies,
      registry,
      directory,
    } = options;

    const tarballsSet = await crawler.getDependencies({
      name,
      version,
      devDependencies,
      peerDependencies,
      registry,
    });

    return downloader.downloadFromIterable(tarballsSet, directory);
  }
}

module.exports = NpmDownloadPackageCommand;
