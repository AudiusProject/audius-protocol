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

async function logIpfsPeerIds () {
  const identity = await ipfs.id()
  // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
  genericLogger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

  // init latest version of ipfs
  const identityLatest = await ipfsLatest.id()
  genericLogger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)
}

/**
 * Wrapper to ipfs.add() -- Allows enabling/disabling adding content to the ipfs daemon. Input must be a buffer.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {Buffer} inputData a single buffer input
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string} hash from content addressing fn or ipfs daemon response
 */
async function ipfsSingleAddWrapper (ipfs, inputData, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  const onlyHash = await ipfsAdd(inputData)

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash}`)
    return onlyHash
  }

  try {
    const ipfsDaemonHash = (await ipfs.add(inputData, ipfsConfig))[0].hash
    logger.info(`[ipfsClient - ipfsSingleAddWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
    return ipfsDaemonHash
  } catch (e) {
    logger.warn(`[ipfsClient - ipfsSingleAddWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${onlyHash}: ${e.toString()}`)
    return onlyHash
  }
}

/**
 * Wrapper to ipfs.addFromFs() -- Allows enabling/disabling adding content to the ipfs daemon. Input must be the file path.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {string} srcPath the file path
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string} hash from content addressing fn or ipfs daemon response
 */
async function ipfsAddFromFsWrapper (ipfs, srcPath, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  const stream = fs.createReadStream(srcPath)
  const onlyHash = await ipfsAdd(stream)

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsAddFromFsWrapper()] onlyHash=${onlyHash}`)
    return onlyHash
  }

  try {
    const ipfsDaemonHash = (await ipfs.addFromFs(srcPath, ipfsConfig))[0].hash
    logger.info(`[ipfsClient - ipfsAddFromFsWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
    return ipfsDaemonHash
  } catch (e) {
    logger.warn(`[ipfsClient - ipfsAddFromFsWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${onlyHash}: ${e.toString()}`)
    return onlyHash
  }
}

/**
 * Wrapper to ipfs.add() for multiple inputs -- Allows enabling/disabling adding content to the ipfs daemon. Generally used for images (to generate dirs too)
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {Object[]} inputData an Object[] with the structure { path: string, content: buffer }
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string|string[]|Object|Object[]} hashes from content addressing fn, or ipfs daemon responses
 */
async function ipfsMultipleAddWrapper (ipfs, inputData, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) {
  const logger = genericLogger.child(logContext)

  const customIpfsAddResp = await ipfsAdd(inputData, {}, true)
  const customIpfsAddRespStr = JSON.stringify(customIpfsAddResp)

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${customIpfsAddRespStr}`)
    return customIpfsAddResp
  }

  try {
    const ipfsDaemonResp = await ipfs.add(inputData, ipfsConfig)
    const ipfsDaemonRespStr = JSON.stringify(ipfsDaemonResp)
    logger.info(`[ipfsClient - ipfsMultipleAddWrapper()] onlyHash=${customIpfsAddRespStr} ipfsDaemonResp=${ipfsDaemonRespStr} isSameHash=${customIpfsAddRespStr === ipfsDaemonRespStr}`)

    return ipfsDaemonResp
  } catch (e) {
    logger.warn(`[ipfsClient - ipfsMultipleAddWrapper()] Could not add content to ipfs. Defaulting to onlyHash=${customIpfsAddRespStr}: ${e.toString()}`)
    return customIpfsAddResp
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

async function ipfsAdd (content, options, isImageFlow = false) {
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

module.exports = {
  ipfs,
  ipfsLatest,
  logIpfsPeerIds,
  ipfsSingleAddWrapper,
  ipfsAddFromFsWrapper,
  ipfsMultipleAddWrapper,
  ipfsAdd
}
