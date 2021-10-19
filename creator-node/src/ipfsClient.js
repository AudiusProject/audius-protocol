const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')
const { importer } = require('ipfs-unixfs-importer')
const fs = require('fs')

const config = require('./config')
const { logger: genericLogger } = require('./logging')

const IPFS_ADD_TIMEOUT_MS = config.get('IPFSAddTimeoutMs')

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
 * Wrapper to ipfs.add() -- Allows enabling/disabling adding content to the ipfs daemon.
 * @param {function} ipfsAddFn ipfs add fn
 * @param {Buffer|ReadStream|string} content a single buffer input, a read stream, or a src path to the file
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string} hash from content addressing fn or ipfs daemon response
 */
async function ipfsSingleAddWrapper (ipfsAddFn, content, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  // If content happens to be a path, create a read stream. This fn does not throw if input is invalid.
  // https://github.com/nodejs/node/blob/f85d5b21fda925b879cf27bdcde81478fc134b31/lib/fs.js#L324-L333
  if (fs.existsSync(content)) { content = fs.createReadStream(content) }

  const onlyHash = await ipfsAddWithoutDaemon(content)

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash}`)
    return onlyHash
  }

  try {
    const ipfsDaemonHash = (await ipfsAddWithTimeout(ipfsAddFn, content, ipfsConfig))[0].hash
    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
    return ipfsDaemonHash
  } catch (e) {
    logger.warn(`[ipfsClient - ipfsSingleAddWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${onlyHash}: ${e.toString()}`)
    return onlyHash
  }
}

/**
 * Wrapper to ipfs.add() for multiple inputs -- Allows enabling/disabling adding content to the ipfs daemon. Generally used for images (to generate dirs too)
 * @param {function} ipfsAddFn ipfs add fn
 * @param {Object[]} content an Object[] with the structure { path: string, content: buffer }
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string|string[]|Object|Object[]} hashes from content addressing fn, or ipfs daemon responses
 */
async function ipfsMultipleAddWrapper (ipfsAddFn, content, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  const ipfsAddWithoutDaemonResp = await ipfsAddWithoutDaemon(content, {}, true)
  const ipfsAddWithoutDaemonRespStr = JSON.stringify(ipfsAddWithoutDaemonResp)

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${ipfsAddWithoutDaemonRespStr}`)
    return ipfsAddWithoutDaemonResp
  }

  try {
    const ipfsDaemonResp = await ipfsAddWithTimeout(ipfsAddFn, content, ipfsConfig)
    const ipfsDaemonRespStr = JSON.stringify(ipfsDaemonResp)
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${ipfsAddWithoutDaemonRespStr} ipfsDaemonResp=${ipfsDaemonRespStr} isSameHash=${ipfsAddWithoutDaemonRespStr === ipfsDaemonRespStr}`)

    return ipfsDaemonResp
  } catch (e) {
    logger.warn(`[ipfsClient - ipfsMultipleAddWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${ipfsAddWithoutDaemonRespStr}: ${e.toString()}`)
    return ipfsAddWithoutDaemonResp
  }
}

// Base functionality taken from https://github.com/alanshaw/ipfs-only-hash/blob/master/index.js

/**
 * Custom fn to generate the content-hashing logic without adding content to ipfs daemon. Can either just
 * return the CID, or the ipfs add response strucutre.
 *
 * At the moment, the image flow requires the entire ipfs.add() response, while other upload flows only
 * require the CID from the ipfs add response.
 * @param {Buffer|ReadStream|Object|Object[]} content content to generate a CID for. If an Object or Object[], will
 * follow the structure { path: string, content: buffer } or [{ path: string, content: buffer }, ...]
 * @param {Object} options options for ipfs importer
 * @param {boolean?} isImageFlow flag to indicate if flow is for image upload
 * @returns {string|Object[]} the cid, or array of ipfs add like responses
 */

const block = {
  get: async cid => { throw new Error(`unexpected block API get for ${cid}`) },
  put: async () => { throw new Error('unexpected block API put') }
}

async function ipfsAddWithoutDaemon (content, options, isImageFlow = false) {
  options = options || {}
  options.onlyHash = true
  options.cidVersion = 0

  if (typeof content === 'string') {
    content = new TextEncoder().encode(content)
  }

  // If method is used for the adding images, structure the response similarly to ipfs.add()
  if (isImageFlow) {
    const resps = []
    for await (const file of importer(content, block, options)) {
      resps.push({
        path: file.path,
        hash: `${file.cid}`,
        size: file.size
      })
    }

    return resps
  } else {
    // Else, just return the hash
    let lastCid
    for await (const { cid } of importer([{ content }], block, options)) {
      lastCid = cid
    }
    return `${lastCid}`
  }
}

async function ipfsAddWithTimeout (ipfsAddFn, content, ipfsConfig = {}, timeout = IPFS_ADD_TIMEOUT_MS) {
  return Promise.race([
    ipfsAddFn(content, ipfsConfig),
    new Promise((resolve, reject) => {
      setTimeout(reject, timeout, `ipfs add took over ${timeout}ms` /* return value */)
    })
  ])
}

module.exports = {
  ipfs,
  ipfsLatest,
  logIpfsPeerIds,
  ipfsSingleAddWrapper,
  ipfsMultipleAddWrapper,
  ipfsAddWithoutDaemon
}
