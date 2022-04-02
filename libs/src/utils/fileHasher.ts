import { importer }  from 'ipfs-unixfs-importer'
import fs from  'fs'
import { hrtime } from 'process'
import { promisify } from 'util'
import { Stream } from 'stream'
const fsReadFile = promisify(fs.readFile)

// Base functionality for only hash logic taken from https://github.com/alanshaw/ipfs-only-hash/blob/master/index.js

type Content = Buffer | Uint8Array | string
interface Hasher {
  options: any
  content: Content
}
interface HashedImage {
  path: string | undefined
  cid: string
  size: number
}

const block: any = {
  get: async (cid: string) => {
    throw new Error(`unexpected block API get for ${cid}`)
  },
  put: async () => {
    throw new Error('unexpected block API put')
  }
}

export class FileHasher {
  static convertNanosToMillis (nanoSeconds: bigint) {
    return nanoSeconds / BigInt(1000000)
  }
  
  /**
   * Used to iniitalize the only hash fns. See Alan Shaw's reference code for more context.
   */
  static initHasher(content: Content, options: any): Hasher {
    options = options || {}
    options.onlyHash = true
    options.cidVersion = 0
  
    if (typeof content === 'string') {
      content = new TextEncoder().encode(content)
    }
  
    return { options, content }
  }
  
  /**
   * Convert content to a buffer; used in `generateNonImageCid()`.
   * @param {ReadStream|Buffer|string} content if string, should be file path
   * @param {Object} logger
   * @returns buffer version of content
   */
  static async convertToBuffer(content: Content, logger: any): Promise<Buffer> {
    if (Buffer.isBuffer(content)) return content
  
    let buffer: any = []
    try {
      if (content instanceof Stream.Readable) {
        await new Promise((resolve, reject) => {
          content.on('data', (chunk: any) => buffer.push(chunk))
          content.on('end', () => resolve(Buffer.concat(buffer)))
          content.on('error', (err: any) => reject(err))
        })
      } else {
        buffer = await fsReadFile(content as string)
      }
    } catch (e: any) {
      const errMsg = `[fileHasher - convertToBuffer()] Could not convert content into buffer: ${e.toString()}`
      logger.error(errMsg)
      throw new Error(errMsg)
    }
  
    return buffer
  }
  
  /**
   * Custom fn to generate the content-hashing logic
   * @param content a buffer of the content
   * @param options options for importer
   * @returns the cid from content addressing logic
   */
  static async hashNonImages (content: Content, options: any = {}): Promise<string> {
    ;({ options, content } = FileHasher.initHasher(content, options))
  
    let lastCid: string = ''
    for await (const { cid } of importer([{ content }] as any, block, options)) {
      lastCid = cid as unknown as string
    }
  
    return `${lastCid}`
  }
  
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
  static async hashImages (content: Content, options: any = {}): Promise<HashedImage[]> {
    ;({ options, content } = FileHasher.initHasher(content, options))
  
    const result: HashedImage[] = []
    for await (const file of importer(content as any, block, options)) {
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
  }
  
  /**
   * Generates CID for a non-image file (track segment, track transcode, metadata)
   * @param {Buffer|ReadStream|string} content a single Buffer, a ReadStream, or path to an existing file
   * @param {Object?} logger
   * @returns {string} only hash response cid
   */
  static async generateNonImageCid (content: Buffer, logger: any = console): Promise<string> {
    const buffer = await FileHasher.convertToBuffer(content, logger)
  
    const startHashing: bigint = hrtime.bigint()
    const cid = await FileHasher.hashNonImages(buffer)
  
    const hashDurationMs = FileHasher.convertNanosToMillis(
      hrtime.bigint() - startHashing
    )
  
    logger.info(
      `[fileHasher - generateNonImageCid()] CID=${cid} hashDurationMs=${hashDurationMs}ms`
    )
  
    return cid
  }
  
  /**
   * Wrapper that generates multihashes for image files
   * @param {Object[]} content an Object[] with the structure [{ path: string, content: buffer }, ...]
   * @param {Object?} logger
   * @returns {Object[]} only hash responses with the structure [{path: <string>, cid: <string>, size: <number>}]
   */
  static async generateImageCids (content: Buffer, logger: any = console): Promise<HashedImage[]> {
    const startHashing: bigint = hrtime.bigint()
    const hashedImages: HashedImage[] = await FileHasher.hashImages(content)
    const hashDurationMs = FileHasher.convertNanosToMillis(
      hrtime.bigint() - startHashing
    )
  
    const hashedImagesStr = JSON.stringify(hashedImages)
    logger.info(
      `[fileHasher - generateImageCids()] hashedImages=${hashedImagesStr} hashImagesDurationMs=${hashDurationMs}ms`
    )
    return hashedImages
  }
}
