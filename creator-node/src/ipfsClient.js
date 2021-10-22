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
 * Wrapper to ipfsLatest.add() -- Allows enabling/disabling adding content to the ipfs daemon.
 *
 * @param {Buffer|string} content a single buffer input, a read stream, or a src path to the file
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string} hash from content addressing fn or ipfs daemon response
 */
async function ipfsSingleAddWrapper (content, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  let buffer = await _convertToBuffer(content, logger)

  const onlyHash = await ipfsAddWithoutDaemon(buffer)

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash}`)
    return onlyHash
  }

  /* ipfs.add with the v43.0.1 (aka ipfsLatest.add) returns a async generator. To access this response, use a `for await... of` loop. Then,
      the response will have the structure:
      {
        path: 'docs/assets/anchor.js',
        cid: CID('QmVHxRocoWgUChLEvfEyDuuD6qJ4PhdDL2dTLcpUy3dSC2'),
        size: 15347
      }
      See https://www.npmjs.com/package/ipfs-http-client/v/43.0.1#example
    */
  try {
    let ipfsDaemonHash
    if (!ipfsConfig.timeout) {
      ipfsConfig.timeout = IPFS_ADD_TIMEOUT_MS
    }

    for await (const ipfsLatestAddWithDaemonResp of ipfsLatest.add(buffer, ipfsConfig)) {
      ipfsDaemonHash = `${ipfsLatestAddWithDaemonResp.cid}`
    }

    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
    return ipfsDaemonHash
  } catch (e) {
    logger.warn(`[ipfsClient - ipfsSingleAddWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${onlyHash}: ${e.toString()}\n${e.stack}`)
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
async function ipfsMultipleAddWrapper (content, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  const ipfsAddWithoutDaemonResp = await ipfsAddWithoutDaemon(content, {}, true)
  const ipfsAddWithoutDaemonRespStr = JSON.stringify(ipfsAddWithoutDaemonResp)

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${ipfsAddWithoutDaemonRespStr}`)
    return ipfsAddWithoutDaemonResp
  }

  try {
    let ipfsAddWithDaemonResp
    if (!ipfsConfig.timeout) {
      ipfsConfig.timeout = IPFS_ADD_TIMEOUT_MS
    }

    for await (const resp of ipfsLatest.add(content, ipfsConfig)) {
      ipfsAddWithDaemonResp = resp
    }

    const ipfsAddWithDaemonRespStr = JSON.stringify(ipfsAddWithDaemonResp)
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${ipfsAddWithoutDaemonRespStr} ipfsAddWithDaemonResp=${ipfsAddWithDaemonRespStr} isSameHash=${ipfsAddWithoutDaemonRespStr === ipfsAddWithDaemonRespStr}`)
    return ipfsAddWithDaemonResp
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
 * @param {Buffer|ReadStream|Object|Object[]|string} content content to generate a CID for. If an Object or Object[], will
 * follow the structure { path: string, content: buffer } or [{ path: string, content: buffer }, ...]. Can directly pass in string as well.
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

/**
 * If the input is not a buffer, then it will be a file path or ReadStream. In the latter case, convert either to a buffer.
 * Used in `ipfsSingleAddWrapper()`.
 *  @param {ReadStream|Buffer|string} content if string, should be file path
 * @param {Object} logger
 * @returns buffer version of content
 */
async function _convertToBuffer (content, logger) {
  // if (
  //   Buffer.isBuffer(content) ||
  //   (content.path && content.content) ||
  //   (content[0] && content[0].path && content[0].content)
  // ) return content

  if (Buffer.isBuffer(content)) return content

  let buffer = []
  try {
    if (fs.existsSync(content)) {
      // is a file path
      buffer = fs.readFileSync(content)
    } else {
      // is a ReadStream
      await new Promise((resolve, reject) => {
        content.on('data', (chunk) => buffer.push(chunk))
        content.on('end', () => resolve(Buffer.concat(buffer)))
        content.on('error', (err) => reject(err))
      })
    }
  } catch (e) {
    const errMsg = `[ipfsClient - ipfsSingleAddWrapper()] Could not convert content into buffer: ${e.toString()}`
    logger.error(errMsg)
    throw new Error(errMsg)
  }

  return buffer
}

module.exports = {
  ipfs,
  ipfsLatest,
  logIpfsPeerIds,
  ipfsSingleAddWrapper,
  ipfsMultipleAddWrapper,
  ipfsAddWithoutDaemon,
  _convertToBuffer
}
