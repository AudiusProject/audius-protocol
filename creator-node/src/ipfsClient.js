const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')
// const Hash = require('ipfs-only-hash')
const { importer } = require('ipfs-unixfs-importer')
const fs = require('fs')

const config = require('./config')
const { logger: genericLogger } = require('./logging')

const ENABLE_ASYNC_IPFS_ADD = config.get('enableAsyncIPFSAdd')

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

/**
 * Wrapper to ipfs.addToFs() -- This wrapper allows for ipfs calls to be made async or synchronous.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {string|string[]} buffers
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {string?} logContext the name of the caller fn
 * @param {boolean?} addToIPFSDaemon flag to override adding to ipfs daemon
 * @returns {string|string[]} hashes
 */
async function ipfsAddWrapper (ipfs, buffers, ipfsConfig = {}, logContext = {}, addToIPFSDaemon = false) {
  const logger = genericLogger.child(logContext)

  // Either an array of hashes, or a hash
  // Note: the if case is specifically written for the `ipfsLatest` add api. See ipfs add code in `resizeImage.js`
  let onlyHashes = []
  let ipfsDaemonHashes
  if (Array.isArray(buffers)) {
    for (const { content } of buffers) {
      const hash = await ipfsHashOf(content)
      onlyHashes.push(hash)
    }

    // Either an array of hashes, or a hash
    if (ENABLE_ASYNC_IPFS_ADD && !addToIPFSDaemon) {
      logger.info(`[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes}`)
      ipfs.add(buffers, ipfsConfig) // Do not await it
    } else {
      ipfsDaemonHashes = await ipfs.add(buffers, ipfsConfig)
      logger.info(`[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes} ipfsDaemonHash=${ipfsDaemonHashes} isSameHash=${onlyHashes === ipfsDaemonHashes}`)
    }
  } else {
    onlyHashes = await ipfsHashOf(buffers)
    // Either an array of hashes, or a hash
    let ipfsDaemonHashes
    if (ENABLE_ASYNC_IPFS_ADD && !addToIPFSDaemon) {
      logger.info(`[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes}`)
      ipfs.add(buffers, ipfsConfig) // Do not await it
    } else {
      ipfsDaemonHashes = (await ipfs.add(buffers, ipfsConfig))[0].hash
      logger.info(`[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes} ipfsDaemonHash=${ipfsDaemonHashes} isSameHash=${onlyHashes === ipfsDaemonHashes}`)
    }
  }

  // If content was added to ipfs daemon, prioritize using that hash response
  return ipfsDaemonHashes || onlyHashes
}

/**
 * Wrapper to ipfs.add() -- This wrapper allows for ipfs calls to be made async or synchronous.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {string|string[]} srcPath
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {string?} logContext request context; used to log more info on caller
 * @returns {string|string[]} hashes
 */
async function ipfsAddToFsWrapper (ipfs, srcPath, ipfsConfig = {}, logContext = {}) {
  const logger = genericLogger.child(logContext)

  const stream = fs.createReadStream(srcPath)
  const onlyHash = await ipfsHashOf(stream)

  let ipfsDaemonHash
  if (ENABLE_ASYNC_IPFS_ADD) {
    logger.info(`[ipfsClient - ipfsAddToFsWrapper()] onlyHash=${onlyHash}`)
    ipfs.addFromFs(srcPath, ipfsConfig) // Do not await it
  } else {
    ipfsDaemonHash = (await ipfs.addFromFs(srcPath, ipfsConfig))[0].hash
    logger.info(`[ipfsClient - ipfsAddToFsWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
  }

  // If content was added to ipfs daemon, prioritize using that hash response
  return ipfsDaemonHash || onlyHash
}

// Custom content-hashing logic. Taken from https://github.com/alanshaw/ipfs-only-hash/blob/master/index.js
const block = {
  get: async cid => { throw new Error(`unexpected block API get for ${cid}`) },
  put: async () => { throw new Error('unexpected block API put') }
}

async function ipfsHashOf (content, options) {
  options = options || {}
  options.onlyHash = true
  options.cidVersion = 0

  if (typeof content === 'string') {
    content = new TextEncoder().encode(content)
  }

  let lastCid
  for await (const { cid } of importer([{ content }], block, options)) {
    lastCid = cid
  }

  return `${lastCid}`
}

module.exports = { ipfs, ipfsLatest, logIpfsPeerIds, ipfsAddWrapper, ipfsAddToFsWrapper, ipfsHashOf }
