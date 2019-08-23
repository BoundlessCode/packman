const { requireCommands } = require('../../core/commandInitializer');

module.exports = {
  name: 'npm',
  description: 'Download package tarballs',
  children: [
    {
      name: 'download',
      description: 'Download package tarballs',
      alias: 'd',
      children: requireCommands(__dirname, 'download'),
    },
    {
      name: 'publish',
      description: 'Publish package tarballs',
      alias: 'p',
      children: requireCommands(__dirname, 'publish'),
    },
    {
      name: 'copy',
      description: 'Download packages from one registry and publish to another',
      alias: 'c',
      children: requireCommands(__dirname, 'copy'),
    },
    {
      name: 'catalog',
      description: 'Generate a packman catalog for a specified registry',
      alias: 'i',
      children: requireCommands(__dirname, 'catalog'),
    },
  ],
}
