const options = {
    directoryOption: {
        flags: '--directory [directory]',
        description: 'the local directory in which to store the downloaded packages',
    },
    devDependenciesOption: '--devDependencies',
    peerDependenciesOption: '--peerDependencies',
    registryOption: '--registry [registry]',
    sourceRegistryOption: {
        flags: '-s, --source <sourceRegistry>',
        description: 'the source registry from which to copy packages (mandatory)',
    },
    targetRegistryOption: {
        flags: '-t, --target <targetRegistry>',
        description: 'the target registry the packages will be copied to, defaults to current registry',
    },
    outputFileOption: '--outputFile [outputFile]',
    indexOption: '--index <indexFile>',
    trackOption: '--track',
    forceOption: '--force',
    verboseOption: '-v, --verbose',
};
options.dependenciesOptions = [
    options.devDependenciesOption,
    options.peerDependenciesOption,
];
options.commonPackageOptions = [
    options.directoryOption,
    ...options.dependenciesOptions,
];
options.globalOptions = [
    options.verboseOption,
];

module.exports = options;
