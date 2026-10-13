import { gcm } from '@noble/ciphers/aes'

const IV_LENGTH = 12
const KEY_LENGTH = 32

/**
 * AES-256-GCM with a random 12-byte IV. The output is the IV followed by the
 * ciphertext and 16-byte tag, the same format as micro-aes-gcm and WebCrypto.
 */
const aes = {
  encrypt: (key: Uint8Array, plaintext: Uint8Array) => {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const ciphertext = gcm(key, iv).encrypt(plaintext)
    const result = new Uint8Array(IV_LENGTH + ciphertext.length)
    result.set(iv)
    result.set(ciphertext, IV_LENGTH)
    return result
  },
  decrypt: (key: Uint8Array, payload: Uint8Array) =>
    gcm(key, payload.slice(0, IV_LENGTH)).decrypt(payload.slice(IV_LENGTH))
}

const lastKeyBytes = (secret: Uint8Array) => {
  const key = secret.slice(secret.length - KEY_LENGTH)
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Uint8Array length ${KEY_LENGTH} expected`)
  }
  return key
}

export class CryptoUtils {
  /**
   * Encrypts data using AES with the last 32 bytes of the secret
   * @param secret The secret key for encryption
   * @param payload The data to encrypt
   */
  static async encrypt(secret: Uint8Array, payload: Uint8Array) {
    return aes.encrypt(lastKeyBytes(secret), payload)
  }

  /**
   * Encrypts a string using AES with the last 32 bytes of the secret
   * @param secret The secret key for encryption
   * @param payload The string to encrypt
   */
  static async encryptString(secret: Uint8Array, payload: string) {
    return await CryptoUtils.encrypt(secret, new TextEncoder().encode(payload))
  }

  /**
   * Decrypts data using AES with the last 32 bytes of the secret
   * @param secret The secret key for decryption
   * @param payload The data to decrypt
   */
  static async decrypt(secret: Uint8Array, payload: Uint8Array) {
    return aes.decrypt(lastKeyBytes(secret), payload)
  }

  /**
   * Decrypts data and converts it to a string using AES with the last 32 bytes of the secret
   * @param secret The secret key for decryption
   * @param payload The data to decrypt
   */
  static async decryptString(secret: Uint8Array, payload: Uint8Array) {
    return new TextDecoder().decode(await CryptoUtils.decrypt(secret, payload))
  }
}
