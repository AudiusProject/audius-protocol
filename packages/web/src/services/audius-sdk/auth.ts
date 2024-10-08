import { SignTypedDataVersion } from '@metamask/eth-sig-util'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'

import { hedgehogInstance } from './hedgehog'

export const auth = {
  sign: async (data: string | Uint8Array) => {
    await hedgehogInstance.waitUntilReady()
    return await secp.sign(
      keccak_256(data),
      // @ts-ignore private key is private
      hedgehogInstance.getWallet()?.privateKey,
      {
        recovered: true,
        der: false
      }
    )
  },
  signTransaction: async (data: any) => {
    const { signTypedData } = await import('@metamask/eth-sig-util')
    await hedgehogInstance.waitUntilReady()

    return signTypedData({
      privateKey: Buffer.from(
        // @ts-ignore private key is private
        hedgehogInstance.getWallet()?.privateKey,
        'hex'
      ),
      data: data as any,
      version: SignTypedDataVersion.V3
    })
  },
  getSharedSecret: async (publicKey: string | Uint8Array) => {
    await hedgehogInstance.waitUntilReady()
    return secp.getSharedSecret(
      // @ts-ignore private key is private
      hedgehogInstance.getWallet()?.privateKey,
      publicKey,
      true
    )
  },
  getAddress: async () => {
    await hedgehogInstance.waitUntilReady()
    return hedgehogInstance.wallet?.getAddressString() ?? ''
  },
  hashAndSign: async (_data: string) => {
    return 'Not implemented'
  }
}
