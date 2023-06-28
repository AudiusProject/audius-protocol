import { EventEmitter } from 'events'

import type { AudiusSdk } from '@audius/sdk'
import { sdk } from '@audius/sdk'

import { auth } from './auth'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'
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
      storageNodeSelector: await getStorageNodeSelector()
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
