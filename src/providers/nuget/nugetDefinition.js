const { requireCommands } = require('../../core/commandInitializer');

module.exports = {
    name: 'nuget',
    description: 'Manage nuget packages',
    children: [
        {
            name: 'download',
            description: 'Download packages',
            alias: 'd',
            children: requireCommands(__dirname, 'download'),
        },
        {
            name: 'publish',
            description: 'Publish packages',
            alias: 'p',
            children: requireCommands(__dirname, 'publish'),
        },
    ],
}
