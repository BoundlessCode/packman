require('colors');

const { version } = require('../../package.json');
const { log } = require('./logger');
const Command = require('./Command');

function initializeProgram(program) {
    initialize({
        command: program,
        starts: 'packman is hungry',
        dies: 'packman dies',
        wins: 'packman wins',
    });

    console.info('packman', version);
}

function initializeCommand(name, children) {
    const command = require('commander');
    initialize({
        command,
        starts: `packman is eating ${name}`,
        dies: `packman died trying to eat ${name}`,
        wins: `packman ate ${name}`,
    });

    if (children) {
        children.forEach((child) => {
            const definition =
                child instanceof Command
                    ? convertCommandToDefinition(child)
                    : child;
            createCommand(definition, command);
        });

        command.parse(process.argv);
    }
}

function createCommand(definition, parentCommand) {
    const {
        name: commandName,
        description,
        options,
        action,
        alias,
    } = definition;

    const command = parentCommand.command(commandName);
    if (description) {
        command.description(description);
    }
    if (action) {
        command.action(action);
    }
    if (alias) {
        command.alias(alias);
    }
    if (options) {
        options.forEach(option => {
            if (typeof option === 'string') {
                command.option(option);
            }
            else {
                command.option(option.flags, option.description);
            }
        });
    }
}

function convertCommandToDefinition(nestedCommand) {
    const definition = {
        ...nestedCommand.definition,
        action: async (...args) => {
            const commandArgument = args.slice(-1).pop();
            const argumentValues = args.slice(0, -1);
            const optionArguments = extractOptionArguments(commandArgument);
            const argumentArguments = extractArgumentArguments(commandArgument, argumentValues);
            const options = {
                ...optionArguments,
                ...argumentArguments,
            };

            log(['command initializer'], `executing command: ${nestedCommand.definition.name}`);
            const result = await nestedCommand.execute(options);
            log(['command initializer'], `command completed: ${nestedCommand.definition.name}`, result && result.length);
            return result;
        },
    };
    return definition;
}

function extractOptionArguments(commandArgument) {
    return commandArgument.options.reduce((options, current) => {
        const name = current.name();
        if (commandArgument.hasOwnProperty(name)) {
            options[name] = commandArgument[name];
        }
        return options;
    }, {});
}

function extractArgumentArguments(commandArgument, argumentValues) {
    const argumentDefinitions = commandArgument._args;
    const argumentArguments = argumentValues.reduce((options, current, index) => {
        const { name } = argumentDefinitions[index];
        options[name] = current;
        return options;
    }, {});
    return argumentArguments;
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
};
