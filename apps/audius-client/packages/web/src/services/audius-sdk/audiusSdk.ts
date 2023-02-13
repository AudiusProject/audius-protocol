import { IntKeys, StringKeys } from '@audius/common'
import {
  sdk,
  DiscoveryNodeSelector,
  stagingConfig,
  productionConfig,
  developmentConfig
} from '@audius/sdk'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'

import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

declare global {
  interface Window {
    audiusLibs: any
    audiusSdk: ReturnType<typeof sdk>
  }
}

const { getRemoteVar, waitForRemoteConfig } = remoteConfigInstance
const getBlockList = (remoteVarKey: StringKeys) => {
  const list = getRemoteVar(remoteVarKey)
  if (list) {
    try {
      return new Set<string>(list.split(','))
    } catch (e) {
      console.error(e)
      return null
    }
  }
  return null
}
let inProgress = false
const SDK_LOADED_EVENT_NAME = 'AUDIUS_SDK_LOADED'

const env = process.env.REACT_APP_ENVIRONMENT
const bootstrapConfig =
  env === 'development'
    ? developmentConfig
    : env === 'staging'
    ? stagingConfig
    : productionConfig

const initSdk = async () => {
  inProgress = true
  await waitForRemoteConfig()
  const discoveryNodeBlockList = getBlockList(
    StringKeys.DISCOVERY_NODE_BLOCK_LIST
  )
  const audiusSdk = sdk({
    appName: 'audius-client',
    services: {
      discoveryNodeSelector: new DiscoveryNodeSelector({
        healthCheckThresholds: {
          minVersion: bootstrapConfig.minVersion,
          maxBlockDiff:
            getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_BLOCK_DIFF) ?? undefined,
          maxSlotDiffPlays:
            getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS) ??
            undefined
        },
        blocklist: discoveryNodeBlockList,
        requestTimeout:
          getRemoteVar(IntKeys.DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS) ??
          undefined,
        bootstrapServices: bootstrapConfig.discoveryNodes
      }),
      walletApi: {
        sign: async (data: string) => {
          await waitForLibsInit()
          return await secp.sign(
            keccak_256(data),
            window.audiusLibs.hedgehog.getWallet().privateKey,
            {
              recovered: true,
              der: false
            }
          )
        },
        getSharedSecret: async (publicKey: string | Uint8Array) => {
          await waitForLibsInit()
          return secp.getSharedSecret(
            window.audiusLibs.hedgehog.getWallet().privateKey,
            publicKey,
            true
          )
        }
      }
    }
  })
  window.audiusSdk = audiusSdk
  inProgress = false
  window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT_NAME))
  return audiusSdk
}

export const audiusSdk = async () => {
  if (inProgress) {
    await new Promise((resolve) => {
      window.addEventListener(SDK_LOADED_EVENT_NAME, resolve)
    })
  } else if (!window.audiusSdk) {
    return await initSdk()
  }
  return window.audiusSdk
}
