import { Buffer } from 'buffer'

/**
 * Stand-in for Node's `crypto` module in the browser bundle.
 *
 * The deps that import `crypto` (tweetnacl, ulid, @noble/secp256k1) only use
 * it as a fallback when Web Crypto is missing, so aliasing `crypto` to
 * crypto-browserify shipped ~350 KB (elliptic, asn1.js, browserify-sign, ...)
 * that never ran. This maps the randomness surface to Web Crypto and fails
 * loudly for anything else.
 */

// getRandomValues rejects requests larger than 65536 bytes
const MAX_RANDOM_BYTES = 65536

export const webcrypto = globalThis.crypto
export const subtle = webcrypto?.subtle

export const getRandomValues = <T extends ArrayBufferView | null>(array: T) =>
  webcrypto.getRandomValues(array)

export const randomUUID = () => webcrypto.randomUUID()

export const randomBytes = (
  size: number,
  callback?: (err: Error | null, buf: Buffer) => void
) => {
  const bytes = new Uint8Array(size)
  for (let i = 0; i < size; i += MAX_RANDOM_BYTES) {
    webcrypto.getRandomValues(
      bytes.subarray(i, Math.min(i + MAX_RANDOM_BYTES, size))
    )
  }
  const buf = Buffer.from(bytes.buffer)
  if (callback) {
    callback(null, buf)
    return undefined
  }
  return buf
}

const unsupported = (name: string) => () => {
  throw new Error(
    `crypto.${name} is not available in the browser build (see crypto-shim.ts)`
  )
}

export const createHash = unsupported('createHash')
export const createHmac = unsupported('createHmac')
export const createCipheriv = unsupported('createCipheriv')
export const createDecipheriv = unsupported('createDecipheriv')
export const pbkdf2 = unsupported('pbkdf2')
export const pbkdf2Sync = unsupported('pbkdf2Sync')
export const scrypt = unsupported('scrypt')

export default {
  webcrypto,
  subtle,
  getRandomValues,
  randomUUID,
  randomBytes,
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  pbkdf2Sync,
  scrypt
}
