const ipfsClient = require('ipfs-http-client')
const config = require('../config')

const ipfs = ipfsClient({
  host: config.get('ipfsHost'),
  port: config.get('ipfsPort')
})

module.exports = ipfs
