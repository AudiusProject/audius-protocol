import bs58 from 'bs58'
import type { BoxKeyPair } from 'tweetnacl'
import nacl from 'tweetnacl'

export const serializeKeyPair = (value: BoxKeyPair) => {
  const { publicKey, secretKey } = value
  const encodedKeyPair = {
    publicKey: bs58.encode(publicKey),
    secretKey: bs58.encode(secretKey)
  }
  return JSON.stringify(encodedKeyPair)
}

export const deserializeKeyPair = (value: string): BoxKeyPair => {
  const { publicKey, secretKey } = JSON.parse(value)
  return {
    publicKey: bs58.decode(publicKey),
    secretKey: bs58.decode(secretKey)
  }
}

export const buildUrl = (path: string, params: URLSearchParams) =>
  `https://phantom.app/ul/v1/${path}?${params.toString()}`

export const encryptPayload = (payload: any, sharedSecret?: Uint8Array) => {
  if (!sharedSecret) throw new Error('missing shared secret')

  const nonce = nacl.randomBytes(24)

  const encryptedPayload = nacl.box.after(
    Buffer.from(JSON.stringify(payload)),
    nonce,
    sharedSecret
  )

  return [nonce, encryptedPayload]
}

export const decryptPayload = (
  data: string,
  nonce: string,
  sharedSecret?: Uint8Array
) => {
  if (!sharedSecret) throw new Error('missing shared secret')

  const decryptedData = nacl.box.open.after(
    bs58.decode(data),
    bs58.decode(nonce),
    sharedSecret
  )
  if (!decryptedData) {
    throw new Error('Unable to decrypt data')
  }
  return JSON.parse(Buffer.from(decryptedData).toString('utf8'))
}
