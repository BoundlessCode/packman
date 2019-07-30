require('colors');

const path = require('path');
const globby = require('globby');
const sade = require('sade');

const { version } = require('../../package.json');
const { logger } = require('./logger');
const Command = require('./Command');

const lifecycleLogger = logger.child({});

const PROGRAM_NAME = 'packman';

function launchProgram(definitions) {
    const program = sade(PROGRAM_NAME);
    program
        .version(version)
        .option('--verbose', 'Enable verbose output');

    logger.info(`${PROGRAM_NAME} is hungry`.cyan, `${version}`.gray);

    monitorLifecycle({
        dies: `${PROGRAM_NAME} dies`,
        wins: `${PROGRAM_NAME} wins`,
    });

    loadDefinitions(program, definitions);

    program.parse(process.argv);
}

function setLoggerVerbosity() {
    if (process.argv.indexOf('--verbose') > -1) {
        logger.level = 'debug';
    }
}

function requireCommands(area, operation) {
    logger.debug(area.blue, operation.cyan, 'requiring...'.gray);
    return globby
        .sync(`./lib/${area}/${operation}/*Command.js`)
        .map(file => {
            const resolvedPath = path.resolve(file) || 'failed to resolve ' + file;
            const imported = require(resolvedPath);
            logger.debug(area.blue, operation.cyan, String(!!imported).gray, resolvedPath.green);
            return imported;
        })
        .map(Command => {
            const commandInfo = new Command();
            const { name = '<no name>' } = commandInfo.definition;
            logger.debug(area.blue, operation.cyan, name.magenta);
            return commandInfo;
        });
}

function monitorLifecycle({ dies, wins }) {
    const start = Date.now();
    process.on('unhandledRejection', error => {
        lifecycleLogger.info('unhandledRejection'.red, error.message);
        lifecycleLogger.error(error);
        process.exitCode = 1;
    })
    process.on('beforeExit', (exitCode) => {
        lifecycleLogger.debug(`completed in ${Date.now() - start}ms`.green);
        lifecycleLogger.info(exitCode ? dies.red : wins.green);
    });
}

function loadDefinitions(program, definitions, names = []) {
    definitions.forEach((definition) => {
        const commandInfo = definition instanceof Command ? definition : null;
        definition = commandInfo ? commandInfo.definition : definition;

        const { name, children } = definition;

        const allNames = names.concat(name);
        logger.debug(`[${names.join(' ')}]`.blue, `loading definition for`.cyan, name ? name.blue : definition);

        createCommand(program, allNames.join(' '), definition, commandInfo);

        if (children) {
            loadDefinitions(program, children, allNames);
        }
    });
}

function createCommand(program, fullName, { flags, description, options }, commandInfo) {
    const nameWithFlags = fullName + (flags ? ' ' + flags : '');

    logger.debug(`[${fullName}]`.blue, 'creating command'.cyan, nameWithFlags.magenta);
    const command = program.command(nameWithFlags, description);

    loadCommandOptions(command, options);
    loadCommandAction(command, commandInfo, fullName);

    logger.debug(`[${fullName}]`.blue, 'created command'.green);
}

function loadCommandOptions(command, options) {
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

function loadCommandAction(command, commandInfo, fullName) {
    if (commandInfo && commandInfo.execute) {
        const action = createAction(fullName, command, commandInfo);
        command.action(action);
    }
    else {
        command.action(() => {
            logger.debug(`${fullName}`.blue, 'has no action, showing help');
            command.help(fullName);
        });
    }
}

function createAction(fullName, command, commandInfo) {
    logger.debug(`[${fullName}]`.blue, 'creating action'.cyan);

    return async (...args) => {
        logger.info(`${PROGRAM_NAME} is eating ${fullName}`);

        let result;

        try {
            const childLogger = logger.child({ command: fullName });
            childLogger.debug(`initializing command`);

            const treeCommand = command.tree[fullName];
            const optionArguments = extractOptions(treeCommand, args);
            const argumentArguments = extractArguments(treeCommand, args, fullName);

            const options = {
                ...optionArguments,
                ...argumentArguments,
                logger: childLogger,
            };
            childLogger.debug(`executing command`);
            result = await commandInfo.execute(options);
            childLogger.debug(`completed command`, result && result.length);
        }
        catch (error) {
            logger.info(`${fullName} ate ${PROGRAM_NAME}`);
            logger.error(error);
        }

        logger.info(`${PROGRAM_NAME} ate ${fullName}`);
        return result;
    };
}

function extractOptions(treeCommand, args) {
    const optionNames =
        treeCommand.options
            .map(optionItem => optionItem[0]
                .replace(/[\[\]\<\>\- ]/g, '')
                .split(',')
                .reduce((longest, current) => longest.length >= current.length ? longest : current)
            );
    const optionValues = args.slice(-1).pop();
    const optionArguments = optionNames.reduce((memo, name) => {
        if (optionValues.hasOwnProperty(name)) {
            memo[name] = optionValues[name];
        }
        return memo;
    }, {});
    return optionArguments;
}

function extractArguments(treeCommand, args, fullName) {
    const argumentNames =
        treeCommand.usage
            .slice(fullName.length + 1)
            .replace(/[\[\]\<\>]/g, '')
            .split(' ');
    const argumentValues = args.slice(0, -1);
    const argumentsObject = argumentNames.reduce((memo, name, index) => {
        memo[name] = argumentValues[index];
        return memo;
    }, {});
    return argumentsObject;
}

module.exports = {
    launchProgram,
    requireCommands,
    setLoggerVerbosity,
};
