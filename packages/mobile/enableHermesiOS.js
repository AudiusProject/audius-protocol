const replace = require('replace-in-file')
const options = {
  files: 'ios/Podfile',
  from: /:hermes_enabled => (true|false)/g,
  to: ':hermes_enabled => true'
}

try {
  replace.sync(options)
} catch (error) {
  console.error('Could not enable Hermes:', error)
}
