import { StringKeys, IntKeys } from '@audius/common'
import { sdk } from '@audius/sdk'

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
const discoveryNodeBlockList = getBlockList(
  StringKeys.DISCOVERY_NODE_BLOCK_LIST
)
let inProgress = false
const SDK_LOADED_EVENT_NAME = 'AUDIUS_SDK_LOADED'

const initSdk = async () => {
  inProgress = true
  await waitForRemoteConfig()
  const audiusSdk = sdk({
    appName: 'audius-client',
    discoveryProviderConfig: {
      blacklist: discoveryNodeBlockList ?? undefined,
      reselectTimeout:
        getRemoteVar(IntKeys.DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS) ??
        undefined,
      selectionRequestTimeout:
        getRemoteVar(IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_TIMEOUT) ??
        undefined,
      selectionRequestRetries:
        getRemoteVar(IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_RETRIES) ??
        undefined,
      unhealthySlotDiffPlays:
        getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS) ?? undefined,
      unhealthyBlockDiff:
        getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_BLOCK_DIFF) ?? undefined
    },
    ethContractsConfig: {
      tokenContractAddress: process.env.REACT_APP_ETH_TOKEN_ADDRESS ?? '',
      registryAddress: process.env.REACT_APP_ETH_REGISTRY_ADDRESS ?? '',
      claimDistributionContractAddress:
        process.env.REACT_APP_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS ?? '',
      wormholeContractAddress: process.env.REACT_APP_WORMHOLE_ADDRESS ?? ''
    },
    ethWeb3Config: {
      tokenAddress: process.env.REACT_APP_ETH_TOKEN_ADDRESS ?? '',
      registryAddress: process.env.REACT_APP_ETH_REGISTRY_ADDRESS ?? '',
      providers: (process.env.REACT_APP_ETH_PROVIDER_URL || '').split(','),
      ownerWallet: process.env.REACT_APP_ETH_OWNER_WALLET,
      claimDistributionContractAddress:
        process.env.REACT_APP_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS ?? '',
      wormholeContractAddress: process.env.REACT_APP_WORMHOLE_ADDRESS ?? ''
    },
    identityServiceConfig: {
      identityServiceEndpoint: process.env.REACT_APP_IDENTITY_SERVICE!
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
