const convict = require('convict')

const config = convict({
})

config.validate()

module.exports = config
