const { requireCommands } = require('../../core/commandInitializer');

module.exports = {
  name: 'bundle',
  description: 'Generate and process packman bundles',
  children: [
    {
      name: 'zip',
      description: 'Create and extract zip files',
      alias: 'z',
      children: requireCommands(__dirname, 'zip'),
    },
  ],
}
