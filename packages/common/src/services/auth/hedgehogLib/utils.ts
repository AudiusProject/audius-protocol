import { authWorker } from './authWorker'
import type { CreateKey, LocalStorage, PrivateKey } from './types'

const SCRYPT_N = 32768
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_DK_LEN = 32

// https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript
export function bufferFromHexString(hexString: string) {
  const byteArray = hexString
    .match(/.{1,2}/g)
    ?.map((byte) => parseInt(byte, 16))
  return new Uint8Array(byteArray as number[])
}

const HEX_CHARS = '0123456789abcdef'

export function bytesToHexString(bytes: Uint8Array) {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += HEX_CHARS[bytes[i] >> 4] + HEX_CHARS[bytes[i] & 15]
  }
  return hex
}

const hexDigit = (c: number) => {
  if (c >= 48 && c <= 57) return c - 48 // 0-9
  if (c >= 97 && c <= 102) return c - 87 // a-f
  if (c >= 65 && c <= 70) return c - 55 // A-F
  return -1
}

/**
 * Decodes hex the way Node's `Buffer.from(str, 'hex')` does: stops at the
 * first pair that is not two hex digits and drops a trailing odd nibble.
 */
export function hexToBytesLikeBuffer(hex: string) {
  const out = new Uint8Array(hex.length >> 1)
  let i = 0
  for (; i < out.length; i++) {
    const hi = hexDigit(hex.charCodeAt(i * 2))
    const lo = hexDigit(hex.charCodeAt(i * 2 + 1))
    if (hi < 0 || lo < 0) break
    out[i] = (hi << 4) | lo
  }
  return out.slice(0, i)
}

export function randomBytes(length: number) {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

export function WebWorker(worker: () => void) {
  if (typeof window !== 'undefined' && window.Worker) {
    const code = worker.toString()
    const blob = new Blob(['(' + code + ')()'])
    return new window.Worker(URL.createObjectURL(blob))
  } else throw new Error('Cannot call web worker on the server')
}

function isReactNativeEnv() {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
}

function isWebEnv() {
  return (
    typeof window !== 'undefined' &&
    !!window &&
    !!window.Worker &&
    !isReactNativeEnv()
  )
}

function isNodeEnv() {
  return typeof window === 'undefined' || window === null
}

export function getPlatformLocalStorage(): LocalStorage {
  if (isWebEnv()) {
    return window.localStorage
  }
  throw new Error(
    'Please pass in valid localStorage object into the Hedgehog constructor'
  )
}

export function getPlatformCreateKey(): CreateKey {
  /**
   * Given a user encryptStr and initialization vector, generate a private key
   * @param encryptStr String to encrypt (can be user password or some kind of lookup key)
   * @param ivHex hex string iv value. Its utf8 bytes (not the decoded hex) are the salt.
   */
  const createKey = async (encryptStr: string, ivHex: string) => {
    if (isWebEnv()) {
      return new Promise<PrivateKey>((resolve) => {
        const worker = WebWorker(authWorker)
        worker.postMessage(JSON.stringify({ encryptStr, ivHex }))

        worker.onmessage = (event) => {
          resolve(event.data)
        }
      })
    }

    if (isNodeEnv()) {
      const { scryptAsync } = await import('@noble/hashes/scrypt')
      const encoder = new TextEncoder()
      const keyBuffer = await scryptAsync(
        encoder.encode(encryptStr),
        encoder.encode(ivHex),
        { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, dkLen: SCRYPT_DK_LEN }
      )
      return { keyHex: bytesToHexString(keyBuffer), keyBuffer }
    }

    throw new Error(
      'Please pass in valid createKey function into the Hedgehog constructor'
    )
  }

  return createKey
}

export function waitUntil(condition: () => boolean) {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (!condition()) {
        return
      }

      clearInterval(interval)
      resolve()
    }, 100)
  })
}
