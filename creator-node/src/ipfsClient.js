const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')

const config = require('./config')
const { logger } = require('./logging')

let ipfs
let ipfsLatest

// Make ipfs clients exportable to be used in rehydrate queue
const initIPFS = async () => {
  if (!ipfs || !ipfsLatest) {
    const ipfsAddr = config.get('ipfsHost')
    if (!ipfsAddr) {
      throw new Error('Must set ipfsAddr')
    }
    ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))
    ipfsLatest = ipfsClientLatest({ host: ipfsAddr, port: config.get('ipfsPort'), protocol: 'http' })

    const identity = await ipfs.id()
    // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
    logger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

    // init latest version of ipfs
    const identityLatest = await ipfsLatest.id()
    logger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)
  }

  return { ipfs, ipfsLatest }
}

initIPFS()

module.exports = { ipfs, ipfsLatest }
