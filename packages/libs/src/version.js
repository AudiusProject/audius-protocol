// Js file shim to get the current libs version from package.json
// This is necessary to prevent importing a file outside of the src
// directory which causes issues with rollup typescript type compilation
const packageJson = require('../package.json')

module.exports.version = packageJson.version
