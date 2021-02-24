const createClient = require('ipfs-http-client')
const { globSource } = createClient

const IPFS_PROTOCOL = process.env.IPFS_PROTOCOL || 'http'
const IPFS_HOST = process.env.IPFS_HOST || 'localhost'
const IPFS_PORT = parseInt(process.env.IPFS_PORT || '5001')
const ipfs = createClient({ 
  protocol: IPFS_PROTOCOL,
  host: IPFS_HOST,
  port: IPFS_PORT
})


module.exports = ipfs
module.exports.globSource = globSource