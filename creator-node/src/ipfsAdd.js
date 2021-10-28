/* global BigInt */

const { importer } = require('ipfs-unixfs-importer')
const fs = require('fs')
const { hrtime } = require('process')
const { promisify } = require('util')
const fsReadFile = promisify(fs.readFile)

const { ipfsLatest } = require('./ipfsClient')
const config = require('./config')
const { logger: genericLogger } = require('./logging')
const { sortKeys } = require('./apiSigning')
const { Stream } = require('stream')

const IPFS_ADD_TIMEOUT_MS = config.get('IPFSAddTimeoutMs')

const ipfsAdd = {}

// Base functionality for only hash logic taken from https://github.com/alanshaw/ipfs-only-hash/blob/master/index.js

const block = {
  get: async cid => { throw new Error(`unexpected block API get for ${cid}`) },
  put: async () => { throw new Error('unexpected block API put') }
}

/**
 * Custom fn to generate the content-hashing logic without adding content to ipfs daemon. Used for adding non-images
 * (track segments, transcoded track, metadata) to ipfs.
 * @param {Buffer} content a buffer of the content to be added to ipfs
 * @param {Object?} options options for importer
 * @returns the cid from content addressing logic only
 */
ipfsAdd.ipfsOnlyHashNonImages = async (content, options = {}) => {
  ({ options, content } = _initializeIPFSOnlyHash(content, options))

  let lastCid
  for await (const { cid } of importer([{ content }], block, options)) {
    lastCid = cid
  }

  return `${lastCid}`
}

/**
 * Custom fn to generate the content-hashing logic without adding content to ipfs daemon. Used for adding images to ipfs.
 * @param {Object[]} content an Object[] with the structure [{ path: string, content: buffer }, ...]
 * @param {Object?} options options for importer
 * @returns an Object[] with the structure [{path: <string>, cid: <string>, size: <number>}]
 *
 * Example with adding a profile picture:
 * [
    {
      "cid": "QmSRyKvnXwoxPZ9UxqxXPR8NXjcPYBEf1qbNrXyo5USqLL",
      "path": "blob/150x150.jpg",
      "size": 3091
    },
    {
      "cid": "QmQQMV9TXxRmDKafZiRvMVkqUNtUu9WGAfukUBS1yCk2ht",
      "path": "blob/480x480.jpg",
      "size": 20743
    },
    {
      "cid": "Qmd8cDdDGcWVaLEoJPVFtkKhYMqvHXZTvXcisYjubFxv1F",
      "path": "blob/1000x1000.jpg",
      "size": 72621
    },
    {
      "cid": "QmaYCPUH8G14yxetsMgW5J5tpTqPaTp3HMd3EAyffZKSvm",
      "path": "blob/original.jpg",
      "size": 185844
    },
    {
      "cid": "QmW8FUFhvaxv1MZmVcUcmR7Tg9WZhGf8xDNBesT9XepwrK",
      "path": "blob",
      "size": 282525
    }
  ]
*/
ipfsAdd.ipfsOnlyHashImages = async (content, options = {}) => {
  ({ options, content } = _initializeIPFSOnlyHash(content, options))

  const resps = []
  for await (const file of importer(content, block, options)) {
    resps.push({
      path: file.path,
      cid: `${file.cid}`,
      size: file.size
    })
  }

  // Note: According to https://github.com/ipfs/js-ipfs-unixfs/tree/master/packages/ipfs-unixfs-importer#example,
  // the importer will return the root as the last file resp. This means that the dir should always be the last index.
  // (As we need it to be in resizeImage.js)
  return resps
}

/**
 * Wrapper for ipfs.add() with flag to exclusively generate the CID using the only hash logic, or to also add content to the ipfs daemon.
 * Used for adding non-images (track segments, track transcode, metadata).
 * @param {Object} ipfsLatest ipfs instance (should be v43.0.1)
 * @param {Buffer|ReadStream|string} content a single Buffer, a ReadStream, or path to an existing file
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {string} only hash response cid or ipfs daemon response cid
 */
ipfsAdd.ipfsAddNonImages = async (content, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) => {
  const logger = genericLogger.child(logContext)

  let buffer = await _convertToBuffer(content, logger)

  const startOnlyHash = hrtime.bigint()
  const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(buffer)
  const durationOnlyHashMs = (hrtime.bigint() - startOnlyHash) / BigInt(1000000) // convert ns -> ms

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsAddNonImages()] onlyHash=${onlyHash} onlyHashDuration=${durationOnlyHashMs}ms`)
    return onlyHash
  }

  /* ipfs.add with the v43.0.1 (aka ipfsLatest.add) returns a async iterator. To access this response, use a `for await... of` loop. Then,
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

    const startIpfsLatestAdd = hrtime.bigint()
    for await (const ipfsLatestAddWithDaemonResp of ipfsLatest.add(buffer, ipfsConfig)) {
      ipfsDaemonHash = `${ipfsLatestAddWithDaemonResp.cid}`
    }
    const durationIpfsLatestAddMs = (hrtime.bigint() - startIpfsLatestAdd) / BigInt(1000000) // convert ns -> ms

    const isSameHash = onlyHash === ipfsDaemonHash
    logger.info(`[ipfsClient - ipfsAddNonImages()] onlyHash=${onlyHash} onlyHashDuration=${durationOnlyHashMs}ms ipfsDaemonHash=${ipfsDaemonHash} ipfsDaemonHashDuration=${durationIpfsLatestAddMs}ms isSameHash=${isSameHash}`)

    if (!isSameHash) {
      throw new Error(`onlyHash=${onlyHash} and ipfsDaemonHash=${ipfsDaemonHash} are not consistent`)
    }
  } catch (e) {
    const errorMsg = `[ipfsClient - ipfsAddNonImages()] Could not add content to ipfs: ${e.toString()}`
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }

  return onlyHash
}

/**
 * Wrapper for ipfs.add() with flag to exclusively generate the CID using the only hash logic, or to also add content to the ipfs daemon.
 * Used for adding images to also generate dir CIDs.
 * @param {Object} ipfsLatest ipfs instance (should be v43.0.1)
 * @param {Object[]} content an Object[] with the structure [{ path: string, content: buffer }, ...]
 * @param {Object?} ipfsConfig ipfs add config options
 * @param {Object?} logContext
 * @param {boolean?} enableIPFSAdd flag to add content to ipfs daemon
 * @returns {Object[]} only hash responses or ipfs daemon responses with the structure [{path: <string>, cid: <string>, size: <number>}]
*/
ipfsAdd.ipfsAddImages = async (content, ipfsConfig = {}, logContext = {}, enableIPFSAdd = false) => {
  const logger = genericLogger.child(logContext)

  const startOnlyHash = hrtime.bigint()
  const ipfsAddWithoutDaemonResp = await ipfsAdd.ipfsOnlyHashImages(content)
  const durationOnlyHashMs = (hrtime.bigint() - startOnlyHash) / BigInt(1000000) // convert ns -> ms

  const ipfsAddWithoutDaemonRespStr = JSON.stringify(sortKeys(ipfsAddWithoutDaemonResp))

  if (!enableIPFSAdd) {
    logger.info(`[ipfsClient - ipfsAddImages()] onlyHash=${ipfsAddWithoutDaemonRespStr} onlyHashDuration=${durationOnlyHashMs}ms`)
    return ipfsAddWithoutDaemonResp
  }

  try {
    if (!ipfsConfig.timeout) {
      ipfsConfig.timeout = IPFS_ADD_TIMEOUT_MS
    }

    const startIpfsLatestAdd = hrtime.bigint()
    let ipfsAddWithDaemonResp = []
    for await (const resp of ipfsLatest.add(content, ipfsConfig)) {
      resp.cid = `${resp.cid}`
      ipfsAddWithDaemonResp.push(resp)
    }
    const durationIpfsLatestAddMs = (hrtime.bigint() - startIpfsLatestAdd) / BigInt(1000000) // convert ns -> ms

    const ipfsAddWithDaemonRespStr = JSON.stringify(sortKeys(ipfsAddWithDaemonResp))

    const isSameResp = ipfsAddWithoutDaemonRespStr === ipfsAddWithDaemonRespStr
    logger.info(`[ipfsClient - ipfsAddImages()] onlyHash=${ipfsAddWithoutDaemonRespStr} onlyHashDuration=${durationOnlyHashMs}ms ipfsAddWithDaemonResp=${ipfsAddWithDaemonRespStr} ipfsAddWithDaemonRespDuration=${durationIpfsLatestAddMs}ms isSameHash=${isSameResp}`)

    if (!isSameResp) {
      throw new Error(`onlyHash=${ipfsAddWithoutDaemonRespStr} and ipfsAddWithDaemonResp=${ipfsAddWithDaemonRespStr} are not consistent`)
    }
  } catch (e) {
    const errorMsg = `[ipfsClient - ipfsAddImages()] Could not add content to ipfs. Defaulting to onlyHash=${ipfsAddWithoutDaemonRespStr}: ${e.toString()}`
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }

  return ipfsAddWithoutDaemonResp
}

/**
 * Used to iniitalize the only hash fns. See Alan Shaw's reference code for more context.
 */
function _initializeIPFSOnlyHash (content, options) {
  options = options || {}
  options.onlyHash = true
  options.cidVersion = 0

  if (typeof content === 'string') {
    content = new TextEncoder().encode(content)
  }

  return { options, content }
}

/**
 * Convert content to a buffer; used in `ipfsAddNonImages()`.
 * @param {ReadStream|Buffer|string} content if string, should be file path
 * @param {Object} logger
 * @returns buffer version of content
 */
async function _convertToBuffer (content, logger) {
  if (Buffer.isBuffer(content)) return content

  let buffer = []
  try {
    if (content instanceof Stream.Readable) {
      await new Promise((resolve, reject) => {
        content.on('data', chunk => buffer.push(chunk))
        content.on('end', () => resolve(Buffer.concat(buffer)))
        content.on('error', err => reject(err))
      })
    } else {
      buffer = await fsReadFile(content)
    }
  } catch (e) {
    const errMsg = `[ipfsClient - _convertToBuffer()] Could not convert content into buffer: ${e.toString()}`
    logger.error(errMsg)
    throw new Error(errMsg)
  }

  return buffer
}

module.exports = ipfsAdd
