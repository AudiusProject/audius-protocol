import { scrypt } from 'scrypt-js'

/**
 * Given a user encryptStr and initialization vector, generate a private key
 * @param encryptStr String to encrypt (can be user password or some kind of lookup key)
 * @param ivHex hex string iv value
 */
export const createPrivateKey = async (encryptStr: string, ivHex: string) => {
  const N = 32768
  const r = 8
  const p = 1
  const dkLen = 32
  const encryptStrBuffer = Buffer.from(encryptStr)
  const ivBuffer = Buffer.from(ivHex)

  // scrypt-js expects Uint8Array inputs
  const keyBuffer = await scrypt(
    new Uint8Array(encryptStrBuffer),
    new Uint8Array(ivBuffer),
    N,
    r,
    p,
    dkLen
  )

  // Convert the Uint8Array to hex string
  const keyHex = Buffer.from(keyBuffer).toString('hex')

  return { keyHex, keyBuffer }
}
