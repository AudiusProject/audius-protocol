import bs58 from 'bs58'
import Web3 from '../LibsWeb3'
import axios, { AxiosResponse } from 'axios'
import Hashids from 'hashids'
import { MultiProvider } from './multiProvider'
import { uuid } from './uuid'
import {
  importDataContractABIs,
  importEthContractABIs
} from './importContractABI'
import { fileHasher } from './fileHasher'
import type { ImageHasher, NonImageHasher, HashedImage } from './fileHasher'

// Hashids

const HASH_SALT = 'azowernasdfoia'
const MIN_LENGTH = 5
const hashids = new Hashids(HASH_SALT, MIN_LENGTH)

const ZeroAddress = '0x0000000000000000000000000000000000000000'

export type { ImageHasher, NonImageHasher, HashedImage }

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- this should just be esm
export class Utils {
  static importDataContractABI(pathStr: string) {
    return importDataContractABIs(pathStr)
  }

  static importEthContractABI(pathStr: string) {
    return importEthContractABIs(pathStr)
  }

  static utf8ToHex(utf8Str: string) {
    return Web3.utils.utf8ToHex(utf8Str)
  }

  static padRight(hexStr: string, size: number) {
    return Web3.utils.padRight(hexStr, size)
  }

  static hexToUtf8(hexStr: string) {
    return Web3.utils.hexToUtf8(hexStr)
  }

  static keccak256(utf8Str: string) {
    return Web3.utils.keccak256(utf8Str)
  }

  static isBN(number: number | string) {
    return Web3.utils.isBN(number)
  }

  static toBN(number: number | string, base?: number) {
    return new Web3.utils.BN(number, base)
  }

  static BN() {
    return Web3.utils.BN
  }

  static checkStrLen(str: string, maxLen: number, minLen = 1) {
    if (
      str === undefined ||
      str === null ||
      str.length > maxLen ||
      str.length < minLen
    ) {
      throw new Error(
        `String '${str}' must be between ${minLen}-${maxLen} characters`
      )
    }
  }

  static async wait(milliseconds: number) {
    return await new Promise<void>((resolve) =>
      setTimeout(resolve, milliseconds)
    )
  }

  // Regular expression to check if endpoint is a FQDN. https://regex101.com/r/kIowvx/2
  static isFQDN(url: string) {
    const FQDN =
      /(?:^|[ \t])((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/gm
    return FQDN.test(url)
  }

  static isHttps(url: string) {
    const https = /^https:\/\//
    return https.test(url)
  }

  // Function to check if the endpont/health_check returns JSON object [ {'healthy':true} ]
  static async isHealthy(url: string) {
    try {
      const { data: body } = await axios.get(url + '/health_check')
      return body.data.healthy
    } catch (error) {
      return false
    }
  }

  static formatOptionalMultihash(multihash: string) {
    if (multihash) {
      return this.decodeMultihash(multihash).digest
    } else {
      return this.utf8ToHex('')
    }
  }

  static decodeMultihash(multihash: string) {
    const base16Multihash = bs58.decode(multihash)
    return {
      digest: `0x${base16Multihash.slice(2).toString('hex')}`,
      hashFn: parseInt(base16Multihash[0] as unknown as string),
      size: parseInt(base16Multihash[1] as unknown as string)
    }
  }

  /**
   * Given a digest value (written on chain, obtained through AudiusABIDecoder.decodeMethod),
   * convert back to a IFPS CIDv0
   * @param multihashDigest digest value from decodeMultihash
   * @returns String CID value
   */
  static encodeMultihash(multihashDigest: string) {
    // the 1220 is from reconstructing the hashFn and size with digest, the opposite of decodeMultihash
    // since IPFS CIDv0 has a fixed hashFn and size, the first two values are always 12 and 20
    // concat them together with digest and encode back to base58
    const digestStr = `1220${multihashDigest.replace('0x', '')}`
    // convert digestStr from hex to base 58
    return bs58.encode(Buffer.from(digestStr, 'hex'))
  }

  static parseDataFromResponse(response: AxiosResponse) {
    if (!response || !response.data) return null

    const obj = response.data

    // adapted from https://github.com/jashkenas/underscore/blob/master/underscore.js _.isEmpty function
    if (obj == null) return null
    if ((Array.isArray(obj) || typeof obj === 'string') && obj.length === 0)
      return null
    if (Object.keys(obj).length === 0) return null

    return obj
  }

  static async configureWeb3(
    web3Provider: string,
    chainNetworkId: string,
    requiresAccount = true
  ) {
    // Initializing web3 with a HttpProvider wrapper for multiple providers
    // ref: https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3/types/index.d.ts#L31.
    const web3Instance = new Web3(new MultiProvider(web3Provider))

    try {
      const networkId = await web3Instance.eth.net.getId()
      if (chainNetworkId && networkId.toString() !== chainNetworkId) {
        return false
      }
      if (requiresAccount) {
        const accounts = await web3Instance.eth.getAccounts()
        if (!accounts || accounts.length < 1) {
          return false
        }
      }
    } catch (e) {
      return false
    }

    return web3Instance
  }

  static get zeroAddress() {
    return ZeroAddress
  }

  static isZeroAddress(address: string) {
    return address === Utils.zeroAddress
  }

  static makeUuid() {
    return uuid()
  }

  /**
   * Decodes a string id into an int. Returns null if an invalid ID.
   */
  static decodeHashId(id: string) {
    try {
      const ids = hashids.decode(id)
      if (!ids.length) return null
      const num = Number(ids[0])
      if (isNaN(num)) return null
      return num
    } catch (e) {
      console.error(`Failed to decode ${id}`, e)
      return null
    }
  }

  /**
   * Encodes an int to a string based hashid
   */
  static encodeHashId(id: number | null) {
    try {
      if (id === null) return null
      const encodedId = hashids.encode(id)
      return encodedId
    } catch (e) {
      console.error(`Failed to encode ${id}`, e)
      return null
    }
  }

  /**
   * If `promise` responds before `timeoutMs`,
   * this function returns its response; else rejects with `timeoutMessage`
   */
  static async racePromiseWithTimeout(
    promise: Promise<void>,
    timeoutMs: number,
    timeoutMessage: string
  ) {
    // eslint-disable-next-line promise/param-names
    const timeoutPromise = new Promise((_promise, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    })
    return await Promise.race([promise, timeoutPromise])
  }

  static fileHasher = fileHasher
}
