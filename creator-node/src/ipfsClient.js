const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')
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
 * Wrapper to ipfs.add() -- This wrapper allows for ipfs calls to be made async or synchronous.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {Buffer|Object[]} inputData either a single buffer, or an Object[] with the structure { path: string, content: buffer }
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} addToIPFSDaemon flag to override adding to ipfs daemon
 * @returns {string|string[]|Object|Object[]} hashes from content addressing fn, or ipfs daemon responses
 */
async function ipfsAddWrapper (ipfs, inputData, ipfsConfig = {}, logContext = {}, addToIPFSDaemon = false) {
  const logger = genericLogger.child(logContext)

  // If async ipfs add is enabled, or if `addToIPFSDaemon` flag passed in is false, asynchronously
  // add to ipfs. Else, synchronously add to ipfs and wait for the response.
  let ipfsDaemonHashes
  if (ENABLE_ASYNC_IPFS_ADD && !addToIPFSDaemon) {
    ipfs.add(inputData, ipfsConfig) // Do not await it
  } else {
    ipfsDaemonHashes = await ipfs.add(inputData, ipfsConfig)
  }

  // If `buffers` is an array, get the content hash of each element. Else, it will be a single element.
  // Also, if `buffers` is a single element, get the single element hash from `ipfsDaemonHashes`
  let onlyHashes = []
  if (Array.isArray(inputData)) {
    // Note: See ipfs add code in `resizeImage.js` for `buffers` structure
    for (const { content } of inputData) {
      const hash = await ipfsHashOf(content)
      onlyHashes.push(hash)
    }
  } else {
    onlyHashes = await ipfsHashOf(inputData)
    ipfsDaemonHashes = ipfsDaemonHashes[0].hash
  }

  const ipfsDaemonHashLogStr = `ipfsDaemonHash=${ipfsDaemonHashes} isSameHash=${onlyHashes === ipfsDaemonHashes}`
  logger.info(`[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes} ${ipfsDaemonHashes ? ipfsDaemonHashLogStr : ''}`)

  // If content was added to ipfs daemon, prioritize using that hash response
  return ipfsDaemonHashes || onlyHashes
}

/**
 * Wrapper to ipfs.add() -- This wrapper allows for ipfs calls to be made async or synchronous.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {string|string[]} srcPath
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @returns {string|string[]|Object|Object[]} hashes from content addressing fn, or ipfs daemon responses
 */
async function ipfsAddFromFsWrapper (ipfs, srcPath, ipfsConfig = {}, logContext = {}) {
  const logger = genericLogger.child(logContext)

  const stream = fs.createReadStream(srcPath)
  const onlyHash = await ipfsHashOf(stream)
  if (ENABLE_ASYNC_IPFS_ADD) {
    logger.info(`[ipfsClient - ipfsAddFromFsWrapper()] onlyHash=${onlyHash}`)
    ipfs.addFromFs(srcPath, ipfsConfig) // Do not await it
    return onlyHash
  }

  const ipfsDaemonHash = (await ipfs.addFromFs(srcPath, ipfsConfig))[0].hash
  logger.info(`[ipfsClient - ipfsAddFromFsWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
  return ipfsDaemonHash
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

module.exports = { ipfs, ipfsLatest, logIpfsPeerIds, ipfsAddWrapper, ipfsAddFromFsWrapper, ipfsHashOf }
