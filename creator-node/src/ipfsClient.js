const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')
const { importer } = require('ipfs-unixfs-importer')
const fs = require('fs')

const config = require('./config')
const { logger: genericLogger } = require('./logging')

// Make ipfs clients exportable to be used in rehydrate queue
const ipfsAddr = config.get('ipfsHost')
if (!ipfsAddr) {
  throw new Error('Must set ipfsAddr')
}
const ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))
const ipfsLatest = ipfsClientLatest({ host: ipfsAddr, port: config.get('ipfsPort'), protocol: 'http' })

const IPFS_ADD_TIMEOUT_MS = config.get('IPFSAddTimeoutMs')

async function logIpfsPeerIds () {
  const identity = await ipfs.id()
  // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
  genericLogger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

  // init latest version of ipfs
  const identityLatest = await ipfsLatest.id()
  genericLogger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)
}

/**
 * Wrapper to ipfs.add() -- Allows enabling/disabling adding content to the ipfs daemon. Generally used for tracks, metadata.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {Buffer} inputData a single buffer input
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string} hash from content addressing fn, or ipfs daemon response
 */
async function ipfsSingleAddWrapper (ipfs, inputData, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  if (!ipfsConfig.timeout) {
    ipfsConfig.timeout = IPFS_ADD_TIMEOUT_MS
  }

  // Generate hash with ipfs content hashing logic
  const onlyHash = await ipfsHashOf(inputData)

  // If async ipfs add is enabled, synchronously add to ipfs.
  let ipfsDaemonHash
  if (enableIPFSAdd) {
    try {
      ipfsDaemonHash = (await ipfs.add(inputData, ipfsConfig))[0].hash
    } catch (e) {
      logger.warn(`[ipfsClient - ipfsSingleAddWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${onlyHash}: ${e.toString()}`)
      return onlyHash
    }
  }

  // Return the `ipfsDaemonHashes`, or `onlyHashes`. Prioritize `ipfsDaemonHashes`.
  if (ipfsDaemonHash) {
    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
    return ipfsDaemonHash
  } else {
    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash}`)
    return onlyHash
  }
}

// TODO: Replace for images and figure out correct response structure
/**
 * Wrapper to ipfs.add() -- Allows enabling/disabling adding content to the ipfs daemon. Generally used for images (to generate dirs too)
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {Object[]} inputData an Object[] with the structure { path: string, content: buffer }
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string|string[]|Object|Object[]} hashes from content addressing fn, or ipfs daemon responses
 */
// eslint-disable-next-line no-unused-vars
async function ipfsMultipleAddWrapper (ipfs, inputData, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  if (!ipfsConfig.timeout) {
    ipfsConfig.timeout = IPFS_ADD_TIMEOUT_MS
  }

  // Generate hashes with ipfs content hashing logic
  const customIpfsAddResponses = await ipfsAdd(inputData, {})

  let ipfsDaemonResp
  if (enableIPFSAdd) {
    try {
      ipfsDaemonResp = await ipfs.add(inputData, ipfsConfig)
    } catch (e) {
      logger.warn(`[ipfsClient - ipfsMultipleAddWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${customIpfsAddResponses}: ${e.toString()}`)
      return customIpfsAddResponses
    }
  }

  // Return the `ipfsDaemonResp`, or `customIpfsAddResponses`. Prioritize `ipfsDaemonResp`.
  if (ipfsDaemonResp) {
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${customIpfsAddResponses} ipfsDaemonResp=${JSON.stringify(ipfsDaemonResp, null, 2)} isSameHash=${JSON.stringify(customIpfsAddResponses) === JSON.stringify(ipfsDaemonResp)}`)
    return ipfsDaemonResp
  } else {
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${customIpfsAddResponses}`)
    return customIpfsAddResponses
  }
}

/**
 * Wrapper to ipfs.addFromFs() -- Allows enabling/disabling adding content to the ipfs daemon.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {string|string[]} srcPath
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @returns {string|string[]|Object|Object[]} hashes from content addressing fn, or ipfs daemon responses
 */
async function ipfsAddFromFsWrapper (ipfs, srcPath, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  // Generate hash with ipfs content hashing logic
  const stream = fs.createReadStream(srcPath)
  const onlyHash = await ipfsHashOf(stream)

  // If async ipfs add is enabled, synchronously add to ipfs.
  let ipfsDaemonHash
  if (enableIPFSAdd) {
    try {
      ipfsDaemonHash = (await ipfs.addFromFs(srcPath, ipfsConfig))[0].hash
    } catch (e) {
      logger.warn(`[ipfsClient - ipfsAddFromFsWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${onlyHash}: ${e.toString()}`)
      return onlyHash
    }
  }

  // Return the `ipfsDaemonHashes`, or `onlyHashes`. Prioritize `ipfsDaemonHashes`.
  if (ipfsDaemonHash) {
    logger.info(`[ipfsClient - ipfsAddFromFsWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
    return ipfsDaemonHash
  } else {
    logger.info(`[ipfsClient - ipfsAddFromFsWrapper()] onlyHash=${onlyHash}`)
    return onlyHash
  }
}

// Custom content-hashing logic. Taken from https://github.com/alanshaw/ipfs-only-hash/blob/master/index.js
const block = {
  get: async cid => { throw new Error(`unexpected block API get for ${cid}`) },
  put: async () => { throw new Error('unexpected block API put') }
}

async function ipfsHashOf (content, options, isImgDir = false) {
  options = options || {}
  options.onlyHash = true
  options.cidVersion = 0

  if (typeof content === 'string') {
    content = new TextEncoder().encode(content)
  }

  // If method is used for the img dir, do not structure as [{ content }]
  if (!isImgDir) {
    content = [{ content }]
  }

  let lastCid
  for await (const { cid } of importer(content, block, options)) {
    lastCid = cid
  }

  return `${lastCid}`
}

// Mimics the response of the ipfs.add() call.
// NOTE: The ipfs.add() response follows the structure {path: <string>, hash: <string>, size: <number>}.
// This fn mimics this response structure
async function ipfsAdd (content, options) {
  options = options || {}
  options.onlyHash = true
  options.cidVersion = 0

  if (typeof content === 'string') {
    content = new TextEncoder().encode(content)
  }

  const files = []
  for await (const file of importer(content, block, options)) {
    files.push(file)
  }

  const resps = files.map(file => ({
    path: file.path,
    hash: `${file.cid}`,
    size: file.size
  }))

  return resps
}

module.exports = {
  ipfs,
  ipfsLatest,
  logIpfsPeerIds,
  ipfsSingleAddWrapper,
  ipfsAddFromFsWrapper,
  ipfsMultipleAddWrapper,
  ipfsHashOf
}
