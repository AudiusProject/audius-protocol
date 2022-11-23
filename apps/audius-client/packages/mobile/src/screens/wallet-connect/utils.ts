import bs58 from 'bs58'
import nacl from 'tweetnacl'

import { useAsyncStorage } from 'app/hooks/useAsyncStorage'

export const buildUrl = (path: string, params: URLSearchParams) =>
  `https://phantom.app/ul/v1/${path}?${params.toString()}`

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

const serializeKeyPair = (value: any) => {
  const { publicKey, secretKey } = value
  const encodedKeyPair = {
    publicKey: bs58.encode(publicKey),
    secretKey: bs58.encode(secretKey)
  }
  return JSON.stringify(encodedKeyPair)
}

const deserializeKeyPair = (value: any) => {
  const { publicKey, secretKey } = JSON.parse(value)
  return {
    publicKey: bs58.decode(publicKey),
    secretKey: bs58.decode(secretKey)
  }
}

export const useDappKeyPair = () => {
  return useAsyncStorage('@phantom/dappKeyPair', nacl.box.keyPair(), {
    serializer: serializeKeyPair,
    deserializer: deserializeKeyPair
  })
}
