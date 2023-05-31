import { EventEmitter } from 'events'

import type { AudiusSdk } from '@audius/sdk'
import { sdk } from '@audius/sdk'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'

import { discoveryNodeSelectorInstance } from './discovery-node-selector'
import { audiusLibs, waitForLibsInit } from './libs'

let inProgress = false
const SDK_LOADED_EVENT_NAME = 'AUDIUS_SDK_LOADED'
const sdkEventEmitter = new EventEmitter()
let sdkInstance: AudiusSdk

const initSdk = async () => {
  inProgress = true

  const audiusSdk = sdk({
    appName: 'audius-mobile-client',
    services: {
      discoveryNodeSelector:
        await discoveryNodeSelectorInstance.getDiscoveryNodeSelector(),
      auth: {
        sign: async (data: string) => {
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
        signTransaction: async (data) => {
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
        }
      }
    }
  })
  sdkInstance = audiusSdk
  inProgress = false
  sdkEventEmitter.emit(SDK_LOADED_EVENT_NAME)
  return audiusSdk
}

export const audiusSdk = async () => {
  if (inProgress) {
    console.log('SDK in progress...')
    await new Promise((resolve) => {
      sdkEventEmitter.addListener(SDK_LOADED_EVENT_NAME, resolve)
    })
    console.log('SDK progress finished')
    return await sdkInstance
  } else if (!sdkInstance) {
    console.log('Making SDK')
    return await initSdk()
  }
  console.log('found sdk')
  return sdkInstance
}
