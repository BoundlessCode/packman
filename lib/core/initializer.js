require('colors');

const { version } = require('../../package.json');

function initializeProgram(program) {
    initialize({
        command: program,
        starts: 'packman is hungry',
        dies: 'packman dies',
        wins: 'packman wins',
    });

    console.info('packman', version);
}

function initializeCommand(command, name) {
    initialize({
        command,
        starts: `packman is eating ${name}`,
        dies: `packman died trying to eat ${name}`,
        wins: `packman ate ${name}`,
    });
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
        console.log(`[${'unhandledRejection'.red}]: ${error.message}`, error);
    })
    process.on('beforeExit', () => {
        console.info(wins.cyan);
        console.log(`completed in ${Date.now() - start}ms`.green);
    });
}

module.exports = {
    initializeProgram,
    initializeCommand,
    monitorLifecycle,
};
