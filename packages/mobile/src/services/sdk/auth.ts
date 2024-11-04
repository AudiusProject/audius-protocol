import { createAuthService } from '@audius/common/services'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'

import { createPrivateKey } from '../createPrivateKey'
import { localStorage } from '../local-storage'

import { identityServiceInstance } from './identity'

export const authService = createAuthService({
  localStorage,
  identityService: identityServiceInstance,
  createKey: createPrivateKey
})
const { hedgehogInstance } = authService

export const auth = {
  sign: async (data: string | Uint8Array) => {
    await hedgehogInstance.waitUntilReady()
    return await secp.sign(
      keccak_256(data),
      hedgehogInstance.getWallet()?.getPrivateKey() as any,
      {
        recovered: true,
        der: false
      }
    )
  },
  signTransaction: async (data: any) => {
    const { signTypedData, SignTypedDataVersion } = await import(
      '@metamask/eth-sig-util'
    )
    await hedgehogInstance.waitUntilReady()

    return signTypedData({
      privateKey: hedgehogInstance.getWallet()!.getPrivateKey(),
      data,
      version: SignTypedDataVersion.V3
    })
  },
  getSharedSecret: async (publicKey: string | Uint8Array) => {
    await hedgehogInstance.waitUntilReady()
    return secp.getSharedSecret(
      hedgehogInstance.getWallet()?.getPrivateKey() as any,
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
