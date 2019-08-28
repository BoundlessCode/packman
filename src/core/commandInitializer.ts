import path from 'path';
import glob from 'glob';
import sade from '@boco/sade';
import camelcase from 'camelcase';

import { logger } from './logger';
import Command, { CommandDefinition, CommandOption, HasCommandDefinition } from './Command';
import { CommandOptionsObject } from './commandOptions.js';

const lifecycleLogger = logger.child({});

const PROGRAM_NAME = 'packman';

interface CliCommand {
    action(action): void
    option(flags: string, description?: string): CliCommand
    command(nameWithFlags: string, description?: string): CliCommand
    help(helpText: string): void
    tree: string[]
}

interface CliProgram extends CliCommand {
    version(version: string): CliProgram
    parse(args: string[]): void
}

export async function launchProgram(definitions: CommandDefinition[]) {
    // todo: create type definition for sade

    const fileName = 'package.json';
    const packageJson = await import('../../' + fileName);
    const { version } = packageJson;

    const program: CliProgram = sade(PROGRAM_NAME);
    program
        .version(version)
        .option('--verbose', 'Enable verbose output');
    loadCommandAction(program, '');

    logger.info(`${PROGRAM_NAME} is hungry`.cyan, `${version}`.gray);

    monitorLifecycle({
        dies: `${PROGRAM_NAME} dies`,
        wins: `${PROGRAM_NAME} wins`,
    });

    await loadDefinitions(program, definitions);

    program.parse(process.argv);
}

export function setLoggerVerbosity() {
    if (process.argv.indexOf('--verbose') > -1) {
        logger.level = 'debug';
    }
}

async function bulkImportInstances(pattern: string, section: string): Promise<HasCommandDefinition[]> {
    logger.debug(section, 'require glob:'.gray, pattern.cyan);

    const files = glob.sync(pattern);
    logger.debug(section, 'globbed files:\n   '.gray, files.join('\n    '));

    const queue = files.map((file) => singleImport(file, section));
    const imported = await Promise.all(queue);
    const instances = imported.map((constructor: { new(): HasCommandDefinition }) => new constructor());
    return instances;
    // const definitions = imported.map((constructor: { new(): HasCommandDefinition }) => 
    // {
    //     const instance = new constructor();
    //     // const { definition } = instance;
    //     return {
    //         instance,
    //         definition,
    //     };
    // });
    // return definitions;
}

async function singleImport(file: string, section: string): Promise<any> {
    const resolvedPath = path.resolve(file) || 'failed to resolve ' + file;
    const imported = await import(resolvedPath);
    logger.debug(section, String(!!imported.default).gray, resolvedPath.green);
    return imported.default;
}

export async function loadPackageProviderDefinitions(): Promise<CommandDefinition[]> {
    logger.debug('loading package providers'.gray);

    const pattern = path.resolve(__dirname, '..', 'providers', '*', '*PackageProvider.js');
    const section = 'load package providers:';

    const instances = await bulkImportInstances(pattern, section);
    return instances.map(instance => instance.definition);
}

// async function loadCommands(area: string, operation: string): Promise<{ command: Command, definition: CommandDefinition }[]> {
async function loadCommands(area: string, operation: string): Promise<{ command: Command, definition: CommandDefinition }[]> {
    logger.debug('requiring commands at'.gray, 'area:', (area || 'n/a').blue, 'operation:', (operation || 'n/a').blue);

    const pattern = path.resolve(area, operation, '*Command.js');
    const section = area.blue + ' ' + operation.cyan + ':';

    const instances = await bulkImportInstances(pattern, section);
    // return instances.map(instance => instance.definition);
    return instances.map(instance => ({
        command: instance as Command,
        definition: instance.definition,
    }));
    // return await bulkImportInstances(pattern, section);
}

type MonitorLifecycleOptions = {
    dies: string
    wins: string
};

function monitorLifecycle({ dies, wins }: MonitorLifecycleOptions) {
    const start = Date.now();
    process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
        lifecycleLogger.info('unhandled rejection at'.red, promise, 'because:', reason);
        lifecycleLogger.error(reason, promise);
        process.exitCode = 1;
    })
    process.on('beforeExit', (exitCode) => {
        lifecycleLogger.debug(`completed in ${Date.now() - start}ms`.green);
        lifecycleLogger.info(exitCode ? dies.red : wins.green);
    });
}

// function loadDefinitions(program: CliProgram, commandsOrDefinitions: (Command | CommandDefinition)[], names: string[] = []) {
async function loadDefinitions(program: CliProgram, definitions: CommandDefinition[], names: string[] = [], command?: Command) {
    for (const definition of definitions) {
        // definitions
        //     // .map(commandOrDefinition => {
        //     //     const command: Command | undefined = 'definition' in commandOrDefinition ? commandOrDefinition as Command : undefined;
        //     //     const definition = command ? command.definition : commandOrDefinition as CommandDefinition;
        //     //     return { command, definition };
        //     //     // 'definition' in definition ? definition.definition : definition
        //     // })
        //     // .forEach(({ command, definition }) => {
        //     .forEach(async (definition) => {
        const { name, children, loadChildren } = definition;

        const allNames = names.concat(name);
        logger.debug(`[${names.join(' ')}]`.blue, `loading definition for`.cyan, name ? name.blue : definition);

        initializeCliCommand(program, allNames.join(' '), definition, command);

        if (children) {
            await loadDefinitions(program, children, allNames);
        }
        if (loadChildren) {
            const commandPairs = await loadCommands(loadChildren.base, loadChildren.dir);
            for (const { command, definition } of commandPairs) {
                await loadDefinitions(program, [definition], allNames, command);
            }
            // for (const { command, definition } of loadedDefinitions) {
            //     // childDefinitions.push(...loadedCommands);
            // }
        }
    }
}

function initializeCliCommand(program: CliProgram, fullName: string, definition: CommandDefinition, command?: Command) {
    const { flags, description, options } = definition;
    const nameWithFlags = fullName + (flags ? ' ' + flags : '');

    logger.debug(`[${fullName}]`.blue, 'initializing cli command'.cyan, nameWithFlags.magenta);
    const cliCommand = program.command(nameWithFlags, description);

    loadCommandOptions(cliCommand, options);
    loadCommandAction(cliCommand, fullName, definition, command);

    logger.debug(`[${fullName}]`.blue, 'initialized cli command'.green);
}

function loadCommandOptions(cliCommand: CliCommand, options?: CommandOption[]) {
    // todo: add sade command type with option method
    if (options) {
        options.forEach(option => {
            if (typeof option === 'string') {
                cliCommand.option(option);
            }
            else {
                cliCommand.option(option.flags, option.description);
            }
        });
    }
}

function loadCommandAction(cliCommand: CliCommand, fullName: string, definition?: CommandDefinition, command?: Command) {
    logger.debug(fullName, ':', definition);
    // todo: use sade command type
    if (command && command.execute) {
        const action = createAction(fullName, cliCommand, command);
        cliCommand.action(action);
    }
    else {
        cliCommand.action(() => {
            logger.debug(`${fullName}`.blue, 'running help action');
            cliCommand.help(fullName);
        });
    }
}

function createAction(fullName: string, cliCommand: CliCommand, command: Command) {
    // todo: use sade command type
    logger.debug(`[${fullName}]`.blue, 'creating action'.cyan);

    return async (...args: string[]) => {
        logger.info(`${PROGRAM_NAME} is eating ${fullName}`);

        let result;

        try {
            const childLogger = logger.child({ command: fullName });
            childLogger.debug(`initializing command`);

            const treeCommand = cliCommand.tree[fullName];
            const optionArguments = extractOptions(treeCommand, args);
            const argumentArguments = extractArguments(treeCommand, args, fullName);

            const options = {
                ...optionArguments,
                ...argumentArguments,
                logger: childLogger,
            };
            childLogger.debug(`executing command`);
            result = await command.execute(options);
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

function extractOptions(treeCommand: any, args: any) {
    // todo: apply sade and cli types
    const optionPattern = /[\[\]\<\> ]*/g;
    const optionNames: string[] =
        treeCommand.options
            .map((optionItem: string[]) =>
                optionItem[0]
                    .replace(optionPattern, '')
                    .split(',')
                    .reduce((longest, current) => longest.length >= current.length ? longest : current)
                    .replace(/^-{0,2}/, '')
            );
    const entries = Object.entries<string>(args.slice(-1).pop());
    const optionValues =
        entries.reduce<CommandOptionsObject>((memo, entry) => {
            const [name, value] = entry;
            const propertyName = name.replace(optionPattern, '');
            memo[propertyName] = value;
            return memo;
        }, {});
    const optionArguments = optionNames.reduce<CommandOptionsObject>((memo, name) => {
        const propertyName = name.replace(optionPattern, '');
        if (optionValues.hasOwnProperty(propertyName)) {
            memo[camelcase(propertyName)] = optionValues[name];
        }
        return memo;
    }, {});
    return optionArguments;
}

type ArgumentsObject = {
    [name: string]: string
};

function extractArguments(treeCommand: any, args: string[], fullName: string) {
    const argumentNames: string[] =
        treeCommand.usage
            .slice(fullName.length + 1)
            .replace(/[\[\]\<\>]/g, '')
            .split(' ');
    const argumentValues = args.slice(0, -1);
    const argumentsObject = argumentNames.reduce<ArgumentsObject>((memo, name, index) => {
        memo[name] = argumentValues[index];
        return memo;
    }, {});
    return argumentsObject;
}
