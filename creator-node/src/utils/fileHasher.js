const { importer } = require('ipfs-unixfs-importer')
const fs = require('fs')
const { promisify } = require('util')
const { Stream } = require('stream')

// Copied from fileHasher.js in libs but without the types

const block = {
  get: async (key, _options) => {
    throw new Error(`unexpected block API get for ${key}`)
  },
  put: async (_key, _val, _options) => {
    throw new Error('unexpected block API put')
  },
  open: async function () {
    throw new Error('Function not implemented.')
  },
  close: async function () {
    throw new Error('Function not implemented.')
  },
  has: async function (_key, _options) {
    throw new Error('Function not implemented.')
  },
  delete: async function (_key, _options) {
    throw new Error('Function not implemented.')
  },
  putMany: function (_source, _options) {
    throw new Error('Function not implemented.')
  },
  getMany: function (_source, _options) {
    throw new Error('Function not implemented.')
  },
  deleteMany: function (_source, _options) {
    throw new Error('Function not implemented.')
  },
  batch: function () {
    throw new Error('Function not implemented.')
  },
  query: function (_query, _options) {
    throw new Error('Function not implemented.')
  },
  queryKeys: function (_query, _options) {
    throw new Error('Function not implemented.')
  }
}

export const fileHasher = {
  convertNanosToMillis(nanoSeconds) {
    return nanoSeconds / BigInt(1000000)
  },

  /**
   * Used to initalize the only hash fns. See Alan Shaw's reference code for more context.
   */
  initImageHasher(content, options) {
    options = options || {}
    options.onlyHash = true
    options.cidVersion = 0

    return { options, content }
  },

  /**
   * Used to iniitalize the only hash fns. See Alan Shaw's reference code for more context.
   */
  initNonImageHasher(content, options) {
    options = options || {}
    options.onlyHash = true
    options.cidVersion = 0

    return { options, content }
  },

  /**
   * Convert content to a buffer; used in `generateNonImageCid()`.
   * @param {ReadStream|Buffer|string} content if string, should be file path
   * @param {Object} logger
   * @returns buffer version of content
   */
  async convertToBuffer(content, logger) {
    if (Buffer.isBuffer(content)) return content

    let buffer
    try {
      if (content instanceof Stream.Readable) {
        await new Promise((resolve, reject) => {
          content.on('data', (chunk) => buffer.push(chunk))
          content.on('end', () => resolve(Buffer.concat(buffer)))
          content.on('error', (err) => reject(err))
        })
      } else {
        const fsReadFile = promisify(fs.readFile)
        buffer = await fsReadFile(content)
      }
    } catch (e) {
      const errMsg = `[fileHasher - convertToBuffer()] Could not convert content into buffer: ${e.toString()}`
      logger.error(errMsg)
      throw new Error(errMsg)
    }

    return buffer
  },

  /**
   * Custom fn to generate the content-hashing logic
   * @param content a buffer of the content
   * @param options options for importer
   * @returns the CID from content addressing logic
   */
  async hashNonImages(content, options = {}) {
    ;({ options, content } = fileHasher.initNonImageHasher(content, options))

    let lastCid = ''
    for await (const { cid } of importer([{ content }], block, options)) {
      lastCid = `${cid}`
    }

    return lastCid
  },

  /**
   * Custom fn to generate the content-hashing logic
   * @param content an Object[] with the structure [{ path: string, content: buffer }, ...]
   * @param options options for importer
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
  async hashImages(content, options = {}) {
    ;({ options, content } = fileHasher.initImageHasher(content, options))

    const result = []
    for await (const file of importer(content, block, options)) {
      result.push({
        path: file.path,
        cid: `${file.cid}`,
        size: file.size
      })
    }

    // Note: According to https://github.com/ipfs/js-ipfs-unixfs/tree/master/packages/ipfs-unixfs-importer#example,
    // the importer will return the root as the last file resp. This means that the dir should always be the last index.
    // (As we need it to be in resizeImage.js)
    return result
  },

  /**
   * Generates CID for a non-image file (track segment, track transcode, metadata)
   * @param {Buffer|ReadStream|string} content a single Buffer, a ReadStream, or path to an existing file
   * @param {Object?} logger
   * @returns {string} only hash response cid
   */
  async generateNonImageCid(content, logger = console) {
    const buffer = await fileHasher.convertToBuffer(content, logger)

    const startHashing = process.hrtime.bigint()
    const cid = await fileHasher.hashNonImages(buffer)

    const hashDurationMs = fileHasher.convertNanosToMillis(
      process.hrtime.bigint() - startHashing
    )

    logger.debug(
      `[fileHasher - generateNonImageCid()] CID=${cid} hashDurationMs=${hashDurationMs}ms`
    )

    return cid
  },

  /**
   * Wrapper that generates multihashes for image files
   * @param {Object[]} content an Object[] with the structure [{ path: string, content: buffer }, ...]
   * @param {Object?} logger
   * @returns {HashedImage[]} only hash responses with the structure [{path: <string>, cid: <string>, size: <number>}]
   */
  async generateImageCids(content, logger = console) {
    const startHashing = process.hrtime.bigint()
    const hashedImages = await fileHasher.hashImages(content)
    const hashDurationMs = fileHasher.convertNanosToMillis(
      process.hrtime.bigint() - startHashing
    )

    const hashedImagesStr = JSON.stringify(hashedImages)
    logger.debug(
      `[fileHasher - generateImageCids()] hashedImages=${hashedImagesStr} hashImagesDurationMs=${hashDurationMs}ms`
    )
    return hashedImages
  }
}
