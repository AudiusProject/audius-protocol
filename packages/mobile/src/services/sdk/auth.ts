import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'

import { audiusLibs, waitForLibsInit } from '../libs'

export const auth = {
  sign: async (data: string | Uint8Array) => {
    await waitForLibsInit()
    return await secp.sign(
      keccak_256(data),
      audiusLibs?.hedgehog?.getWallet()?.getPrivateKey() as any,
      {
        recovered: true,
        der: false
      }
    )
  },
  signTransaction: async (_data) => {
    // TODO(nkang): Can probably just use eth-sig-util signTransaction like in the web audiusSdk service, but need to test it thoroughly in a mobile env. So saving that for later.
    return 'Not implemented'
  },
  getSharedSecret: async (publicKey: string | Uint8Array) => {
    await waitForLibsInit()
    return secp.getSharedSecret(
      audiusLibs?.hedgehog?.getWallet()?.getPrivateKey() as any,
      publicKey,
      true
    )
  },
  getAddress: async () => {
    await waitForLibsInit()
    return audiusLibs?.hedgehog?.wallet?.getAddressString() ?? ''
  },
  hashAndSign: async (_data: string) => {
    return 'Not implemented'
  }
}
