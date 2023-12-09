import { EventEmitter } from 'events'

import type { AudiusSdk } from '@audius/sdk'
import { sdk } from '@audius/sdk'

import { auth } from './auth'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'
import { solanaService } from './solana'
import { getStorageNodeSelector } from './storageNodeSelector'

let inProgress = false
const SDK_LOADED_EVENT_NAME = 'AUDIUS_SDK_LOADED'
const sdkEventEmitter = new EventEmitter()
let sdkInstance: AudiusSdk

const initSdk = async () => {
  inProgress = true

  const audiusSdk = sdk({
    appName: 'audius-mobile-client',
    services: {
      discoveryNodeSelector: await discoveryNodeSelectorService.getInstance(),
      auth,
      storageNodeSelector: await getStorageNodeSelector(),
      solana: solanaService
    }
  })
  sdkInstance = audiusSdk
  inProgress = false
  sdkEventEmitter.emit(SDK_LOADED_EVENT_NAME)
  return audiusSdk
}

export const audiusSdk = async () => {
  if (inProgress) {
    await new Promise((resolve) => {
      sdkEventEmitter.addListener(SDK_LOADED_EVENT_NAME, resolve)
    })
    return await sdkInstance
  } else if (!sdkInstance) {
    return await initSdk()
  }
  return sdkInstance
}
