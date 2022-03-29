/* global BigInt */

const { importer } = require('ipfs-unixfs-importer')
const fs = require('fs')
const { hrtime } = require('process')
const { promisify } = require('util')
const fsReadFile = promisify(fs.readFile)
const _ = require('lodash')

const { logger: genericLogger } = require('./logging')
const { Stream } = require('stream')

const ipfsAdd = {}

// Base functionality for only hash logic taken from https://github.com/alanshaw/ipfs-only-hash/blob/master/index.js

const convertNanosToMillis = (nanoSeconds) => nanoSeconds / BigInt(1000000)

const block = {
  get: async (cid) => {
    throw new Error(`unexpected block API get for ${cid}`)
  },
  put: async () => {
    throw new Error('unexpected block API put')
  }
}

/**
 * Custom fn to generate the content-hashing logic without adding content to ipfs daemon.
 * @param {Buffer} content a buffer of the content
 * @param {Object?} options options for importer
 * @returns the cid from content addressing logic only
 */
ipfsAdd.ipfsOnlyHashNonImages = async (content, options = {}) => {
  ;({ options, content } = _initializeIPFSOnlyHash(content, options))

  let lastCid
  for await (const { cid } of importer([{ content }], block, options)) {
    lastCid = cid
  }

  return `${lastCid}`
}

/**
 * Custom fn to generate the content-hashing logic without adding content to ipfs daemon.
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
  ;({ options, content } = _initializeIPFSOnlyHash(content, options))

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
 * Wrapper that generates multihashes for non-image files (track segments, track transcode, metadata)
 * @param {Buffer|ReadStream|string} content a single Buffer, a ReadStream, or path to an existing file
 * @param {Object?} logContext
 * @returns {string} only hash response cid or ipfs daemon response cid
 */
ipfsAdd.generateNonImageMultihashes = async (content, logContext = {}) => {
  const logger = genericLogger.child(logContext)

  const buffer = await _convertToBuffer(content, logger)

  const startOnlyHash = hrtime.bigint()
  const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(buffer)
  const durationOnlyHashMs = convertNanosToMillis(
    hrtime.bigint() - startOnlyHash
  )

  logger.info(
    `[ipfsClient - generateNonImageMultihashes()] onlyHash=${onlyHash} onlyHashDuration=${durationOnlyHashMs}ms`
  )
  return onlyHash
}

/**
 * Wrapper that generates multihashes for image files
 * @param {Object[]} content an Object[] with the structure [{ path: string, content: buffer }, ...]
 * @param {Object?} logContext
 * @returns {Object[]} only hash responses with the structure [{path: <string>, cid: <string>, size: <number>}]
 */
ipfsAdd.generateImageMultihashes = async (content, logContext = {}) => {
  const logger = genericLogger.child(logContext)

  const startOnlyHash = hrtime.bigint()
  const multihashes = await ipfsAdd.ipfsOnlyHashImages(content)
  const durationOnlyHashMs = convertNanosToMillis(
    hrtime.bigint() - startOnlyHash
  )

  const multihashesStr = JSON.stringify(multihashes)
  logger.info(
    `[ipfsClient - generateImageMultihashes()] onlyHash=${multihashesStr} onlyHashDuration=${durationOnlyHashMs}ms`
  )
  return multihashes
}

/**
 * Used to iniitalize the only hash fns. See Alan Shaw's reference code for more context.
 */
function _initializeIPFSOnlyHash(content, options) {
  options = options || {}
  options.onlyHash = true
  options.cidVersion = 0

  if (typeof content === 'string') {
    content = new TextEncoder().encode(content)
  }

  return { options, content }
}

/**
 * Convert content to a buffer; used in `generateNonImageMultihashes()`.
 * @param {ReadStream|Buffer|string} content if string, should be file path
 * @param {Object} logger
 * @returns buffer version of content
 */
async function _convertToBuffer(content, logger) {
  if (Buffer.isBuffer(content)) return content

  let buffer = []
  try {
    if (content instanceof Stream.Readable) {
      await new Promise((resolve, reject) => {
        content.on('data', (chunk) => buffer.push(chunk))
        content.on('end', () => resolve(Buffer.concat(buffer)))
        content.on('error', (err) => reject(err))
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
