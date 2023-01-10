import { EventEmitter } from 'events'

import { StringKeys, IntKeys } from '@audius/common'
import { sdk } from '@audius/sdk'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'
import Config from 'react-native-config'

import { audiusLibs, waitForLibsInit } from './libs'
import { remoteConfigInstance } from './remote-config/remote-config-instance'

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
const sdkEventEmitter = new EventEmitter()
let sdkInstance: any // ReturnType<typeof sdk>

const initSdk = async () => {
  inProgress = true
  await waitForRemoteConfig()
  const ethWeb3Config = {
    tokenAddress: Config.ETH_TOKEN_ADDRESS ?? '',
    registryAddress: Config.ETH_REGISTRY_ADDRESS ?? '',
    providers: (Config.ETH_PROVIDER_URL || '').split(','),
    ownerWallet: Config.ETH_OWNER_WALLET,
    claimDistributionContractAddress:
      Config.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS ?? '',
    wormholeContractAddress: Config.WORMHOLE_ADDRESS ?? ''
  }
  const audiusSdk = sdk({
    appName: 'audius-mobile-client',
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
      tokenContractAddress: Config.ETH_TOKEN_ADDRESS ?? '',
      registryAddress: Config.ETH_REGISTRY_ADDRESS ?? '',
      claimDistributionContractAddress:
        Config.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS ?? '',
      wormholeContractAddress: Config.WORMHOLE_ADDRESS ?? ''
    },
    ethWeb3Config,
    identityServiceConfig: {
      identityServiceEndpoint: Config.IDENTITY_SERVICE!
    },
    walletApi: {
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
      getSharedSecret: async (publicKey: string | Uint8Array) => {
        await waitForLibsInit()
        return secp.getSharedSecret(
          audiusLibs?.hedgehog?.getWallet()?.getPrivateKey() as any,
          publicKey,
          true
        )
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
