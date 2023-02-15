const convict = require('convict')
const dotenv = require('dotenv')
const convictConfig = require('./convict.json')

// Load up any env-var overrides
dotenv.config({ path: './config/conf.sh' })

const config = convict(convictConfig)

module.exports = config
