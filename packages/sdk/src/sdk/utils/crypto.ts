import * as aes from 'micro-aes-gcm'

export class CryptoUtils {
  /**
   * Encrypts data using AES with the last 32 bytes of the secret
   * @param secret The secret key for encryption
   * @param payload The data to encrypt
   */
  static async encrypt(secret: Uint8Array, payload: Uint8Array) {
    return await aes.encrypt(secret.slice(secret.length - 32), payload)
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
    return await aes.decrypt(secret.slice(secret.length - 32), payload)
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
