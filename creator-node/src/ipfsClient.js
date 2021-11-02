const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')

const config = require('./config')
const { logger: genericLogger } = require('./logging')

// Make ipfs clients exportable to be used in rehydrate queue
const ipfsAddr = config.get('ipfsHost')
if (!ipfsAddr) {
  throw new Error('Must set ipfsAddr')
}
const ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))
const ipfsLatest = ipfsClientLatest({ host: ipfsAddr, port: config.get('ipfsPort'), protocol: 'http' })

async function logIpfsPeerIds () {
  const identity = await ipfs.id()
  // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
  genericLogger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

  // init latest version of ipfs
  const identityLatest = await ipfsLatest.id()
  genericLogger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)
}

module.exports = {
  ipfs,
  ipfsLatest,
  logIpfsPeerIds
}
