import fs from 'fs'
import { Stream } from 'stream'
import * as util from 'util'

import type { Blockstore, Options } from 'interface-blockstore'
import type {
  AwaitIterable,
  Pair,
  Batch,
  Query,
  KeyQuery
} from 'interface-store'
import {
  ImportCandidate,
  importer,
  UserImporterOptions
} from 'ipfs-unixfs-importer'
import { CID } from 'multiformats/cid'
import * as json from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

// Base functionality for only hash logic taken from https://github.com/alanshaw/ipfs-only-hash/blob/master/index.js

export type Content = ReadableStream | Buffer | string
export interface ImageHasher {
  options: UserImporterOptions
  content: ImportCandidate
}
export interface NonImageHasher {
  options: UserImporterOptions
  content: Uint8Array
}
export interface HashedImage {
  path: string | undefined
  cid: string
  size: number
}

const { promisify } = util

const block: Blockstore = {
  get: async (key: CID, _options?: Options) => {
    throw new Error(`unexpected block API get for ${key}`)
  },
  put: async (_key: CID, _val: Uint8Array, _options?: Options) => {
    throw new Error('unexpected block API put')
  },
  open: async function (): Promise<void> {
    throw new Error('Function not implemented.')
  },
  close: async function (): Promise<void> {
    throw new Error('Function not implemented.')
  },
  has: async function (_key: CID, _options?: Options): Promise<boolean> {
    throw new Error('Function not implemented.')
  },
  delete: async function (_key: CID, _options?: Options): Promise<void> {
    throw new Error('Function not implemented.')
  },
  putMany: function (
    _source: AwaitIterable<Pair<CID, Uint8Array>>,
    _options?: Options
  ): AsyncIterable<Pair<CID, Uint8Array>> {
    throw new Error('Function not implemented.')
  },
  getMany: function (
    _source: AwaitIterable<CID>,
    _options?: Options
  ): AsyncIterable<Uint8Array> {
    throw new Error('Function not implemented.')
  },
  deleteMany: function (
    _source: AwaitIterable<CID>,
    _options?: Options
  ): AsyncIterable<CID> {
    throw new Error('Function not implemented.')
  },
  batch: function (): Batch<CID, Uint8Array> {
    throw new Error('Function not implemented.')
  },
  query: function (
    _query: Query<CID, Uint8Array>,
    _options?: Options
  ): AsyncIterable<Pair<CID, Uint8Array>> {
    throw new Error('Function not implemented.')
  },
  queryKeys: function (
    _query: KeyQuery<CID>,
    _options?: Options
  ): AsyncIterable<CID> {
    throw new Error('Function not implemented.')
  }
}

export const fileHasher = {
  convertNanosToMillis(nanoSeconds: bigint) {
    return nanoSeconds / BigInt(1000000)
  },

  /**
   * Used to initalize the only hash fns. See Alan Shaw's reference code for more context.
   */
  initImageHasher(
    content: ImportCandidate,
    options: UserImporterOptions
  ): ImageHasher {
    options = options || {}
    options.onlyHash = true
    options.cidVersion = 0

    return { options, content }
  },

  /**
   * Used to iniitalize the only hash fns. See Alan Shaw's reference code for more context.
   */
  initNonImageHasher(
    content: Uint8Array,
    options: UserImporterOptions
  ): NonImageHasher {
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
  async convertToBuffer(content: Content, logger: any): Promise<Buffer> {
    if (Buffer.isBuffer(content)) return content

    let buffer: any
    try {
      if (content instanceof Stream.Readable) {
        await new Promise((resolve, reject) => {
          content.on('data', (chunk: any) => buffer.push(chunk))
          content.on('end', () => resolve(Buffer.concat(buffer)))
          content.on('error', (err: any) => reject(err))
        })
      } else {
        const fsReadFile = promisify(fs.readFile)
        buffer = await fsReadFile(content as string)
      }
    } catch (e: any) {
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
   * @returns the V0 CID from content addressing logic
   */
  async hashNonImages(
    content: Uint8Array,
    options: UserImporterOptions = {}
  ): Promise<string> {
    ;({ options, content } = fileHasher.initNonImageHasher(content, options))

    let lastCid: string = ''
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
  async hashImages(
    content: ImportCandidate,
    options: UserImporterOptions = {}
  ): Promise<HashedImage[]> {
    ;({ options, content } = fileHasher.initImageHasher(content, options))

    const result: HashedImage[] = []
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
   * Generates CID V0 (46-char string starting with "Qm") for a non-image file (track segment, track transcode, metadata)
   * @param {Buffer|ReadStream|string} content a single Buffer, a ReadStream, or path to an existing file
   * @param {Object?} logger
   * @returns {string} only hash response cid
   */
  async generateNonImageCid(
    content: Content,
    logger: any = console
  ): Promise<string> {
    const buffer = await fileHasher.convertToBuffer(content, logger)
    return await fileHasher.hashNonImages(buffer)
  },

  /**
   * Generates CID V1 for a JSON metadata object (NOT the string of the metadata - must be an object).
   * CID<T, 512, SHA_256, 1> represents CID with json codec (512) and sha256 hash using CID V1.
   * Call toString() on the result to get the CID V1 string.
   */
  async generateMetadataCidV1(metadata: {}): Promise<CID> {
    const bytes = json.encode(metadata)
    const hash = await sha256.digest(bytes)
    return CID.create(1, json.code, hash)
  },

  /**
   * Wrapper that generates multihashes for image files
   * @param {Object[]} content an Object[] with the structure [{ path: string, content: buffer }, ...]
   * @param {Object?} logger
   * @returns {HashedImage[]} only hash responses with the structure [{path: <string>, cid: <string>, size: <number>}]
   */
  async generateImageCids(
    content: ImportCandidate,
    _: any = console
  ): Promise<HashedImage[]> {
    return await fileHasher.hashImages(content)
  }
}
