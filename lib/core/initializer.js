require('colors');

const { Option } = require('commander');
const { version } = require('../../package.json');
const log = require('./logger');

const options = {
    directoryOption: new Option('--directory [directory]', 'the local directory in which to store the downloaded packages'),
    devDependenciesOption: '--devDependencies',
    peerDependenciesOption: '--peerDependencies',
    registryOption: '--registry [registry]',
    sourceRegistryOption: new Option('-s, --source <sourceRegistry>', 'the source registry from which to copy packages (mandatory)'),
    targetRegistryOption: new Option('-t, --target <targetRegistry>', 'the target registry the packages will be copied to, defaults to current registry'),
    outputFile: '--outputFile [outputFile]',
};
options.dependenciesOptions = [
    options.devDependenciesOption,
    options.peerDependenciesOption,
];
options.commonPackageOptions = [
    options.directoryOption,
    ...options.dependenciesOptions,
];

function initializeProgram(program) {
    initialize({
        command: program,
        starts: 'packman is hungry',
        dies: 'packman dies',
        wins: 'packman wins',
    });

    console.info('packman', version);
}

function initializeCommand(name, commandsObject) {
    const command = require('commander');
    initialize({
        command,
        starts: `packman is eating ${name}`,
        dies: `packman died trying to eat ${name}`,
        wins: `packman ate ${name}`,
    });

    if (commandsObject) {
        commandsObject.forEach(({ name, description, options, action }) => {
            const item =
                command
                    .command(name)
                    .description(description)
                    .action(action);
            options.forEach(option => {
                if (option instanceof Option) {
                    item.options.push(option);
                }
                else {
                    item.option(option);
                }
            });
        });

        command.parse(process.argv);
    }
}

function initialize({ command, starts, dies, wins }) {
    console.info(starts.cyan);

    monitorLifecycle({ dies, wins });

    command.version(version);
}

function monitorLifecycle({ dies, wins }) {
    const start = Date.now();
    process.on('unhandledRejection', error => {
        console.info(dies.cyan);
        log(['lifecycle', 'unhandledRejection'.red], error.message, error);
    })
    process.on('beforeExit', () => {
        console.info(wins.cyan);
        log(['lifecycle'], `completed in ${Date.now() - start}ms`.green);
    });
}

module.exports = {
    initializeProgram,
    initializeCommand,
    monitorLifecycle,
    options,
};
