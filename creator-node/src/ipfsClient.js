const ipfsClient = require('ipfs-http-client')
const ipfsClientWithCat = require('ipfs-http-client-cat')

const config = require('./config')
const { logger } = require('./logging')

let ipfs
let ipfsWithCat

// Make ipfs clients exportable to be used in rehydrate queue

const initIPFS = async () => {
  const ipfsAddr = config.get('ipfsHost')
  if (!ipfsAddr) {
    throw new Error('Must set ipfsAddr')
  }
  ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))
  ipfsWithCat = ipfsClientWithCat({ host: ipfsAddr, port: config.get('ipfsPort'), protocol: 'http' })

  // initialize ipfs here
  const identity = await ipfs.id()
  // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
  logger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

  // init latest version of ipfs
  const identityLatest = await ipfsWithCat.id()
  logger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)

  console.log({ ipfs, ipfsWithCat })
  return { ipfs, ipfsWithCat }
}

module.exports = (async function () {
  if (!ipfs || !ipfsWithCat) {
    await initIPFS()
  }

  return { ipfs, ipfsWithCat }
})()
