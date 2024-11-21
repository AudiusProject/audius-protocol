import { createAuthService } from '@audius/common/services'
import { personalSign, SignTypedDataVersion } from '@metamask/eth-sig-util'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'

import { localStorage } from '../local-storage'

import { identityServiceInstance } from './identity'

export const authService = createAuthService({
  localStorage,
  identityService: identityServiceInstance
})
const { hedgehogInstance } = authService

export const sdkAuthAdapter = {
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
  hashAndSign: async (data: string) => {
    await hedgehogInstance.waitUntilReady()
    const wallet = hedgehogInstance.getWallet()
    if (!wallet) throw new Error('No wallet')
    return personalSign({
      privateKey: wallet.getPrivateKey(),
      data: keccak_256(data)
    })
  }
}
