require('colors');

const { version } = require('../../package.json');
const log = require('./logger');

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
    outputFile: '--outputFile [outputFile]',
    index: '--index <indexFile>',
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

function initializeCommand(name, definitions) {
    const command = require('commander');
    initialize({
        command,
        starts: `packman is eating ${name}`,
        dies: `packman died trying to eat ${name}`,
        wins: `packman ate ${name}`,
    });

    if (definitions) {
        definitions.forEach((definition) => {
            const {
                name: commandName,
                description,
                options,
                action,
                alias,
            } = definition;
            const item = command.command(commandName);
            if(description) {
                item.description(description);
            }
            if (action) {
                item.action(action);
            }
            if (alias) {
                item.alias(alias);
            }
            if (options) {
                options.forEach(option => {
                    if (typeof option === 'string') {
                        item.option(option);
                    }
                    else {
                        item.option(option.flags, option.description)
                    }
                });
            }
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
