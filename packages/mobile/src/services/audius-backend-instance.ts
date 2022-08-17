import EventEmitter from 'events'

import * as nativeLibs from '@audius/sdk/dist/native-libs'
import type { AudiusLibs } from '@audius/sdk/dist/native-libs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { audiusBackend } from 'audius-client/src/common/services/audius-backend'
import Config from 'react-native-config'
import scrypt from 'react-native-scrypt'

import { track } from 'app/utils/analytics'

import { monitoringCallbacks } from './monitoringCallbacks'
import { getFeatureEnabled } from './remote-config'
import { remoteConfigInstance } from './remote-config/remote-config-instance'

// TODO: declare this at the root and use actual audiusLibs type
declare global {
  interface Window {
    audiusLibs: any
  }
}

const libsInitEventEmitter = new EventEmitter()

export let audiusLibs: AudiusLibs

const LIBS_INITTED_EVENT = 'LIBS_INITTED_EVENT'

/**
 * Wait for the `LIBS_INITTED_EVENT` or pass through if there
 * already exists a mounted `window.audiusLibs` object.
 */
const waitForLibsInit = async () => {
  // If libs is already defined, it has already loaded & initted
  // so do nothing
  if (audiusLibs) return
  // Add an event listener and resolve when that returns
  return new Promise<void>((resolve) => {
    if (audiusLibs) {
      resolve()
    } else {
      libsInitEventEmitter.addListener(LIBS_INITTED_EVENT, resolve)
    }
  })
}

function bufferFromHexString(hexString: string) {
  const byteArray = hexString
    .match(/.{1,2}/g)
    ?.map((byte) => parseInt(byte, 16))
  return new Uint8Array(byteArray as number[])
}

/**
 * Given a user encryptStr and initialization vector, generate a private key
 * @param encryptStr String to encrypt (can be user password or some kind of lookup key)
 * @param ivHex hex string iv value
 */
const createKey = async (encryptStr: string, ivHex: string) => {
  const N = 32768
  const r = 8
  const p = 1
  const dkLen = 32
  const encryptStrBuffer = Buffer.from(encryptStr)
  const ivBuffer = Buffer.from(ivHex)

  const derivedKey = await scrypt(
    encryptStrBuffer,
    ivBuffer,
    N,
    r,
    p,
    dkLen,
    'buffer'
  )
  const keyHex = derivedKey.toString('hex')

  // This is the private key
  const keyBuffer = bufferFromHexString(keyHex)
  return { keyHex, keyBuffer }
}

/**
 * audiusBackend initialized for a mobile environment
 */
export const audiusBackendInstance = audiusBackend({
  claimDistributionContractAddress: Config.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  ethOwnerWallet: Config.ETH_OWNER_WALLET,
  ethProviderUrls: (Config.ETH_PROVIDER_URL || '').split(','),
  ethRegistryAddress: Config.ETH_REGISTRY_ADDRESS,
  ethTokenAddress: Config.ETH_TOKEN_ADDRESS,
  fetchCID: async () => ({}),
  getFeatureEnabled,
  getHostUrl: () => {
    return `${Config.PUBLIC_PROTOCOL}//${Config.PUBLIC_HOSTNAME}`
  },
  getWeb3Config: async (libs, registryAddress, web3ProviderUrls) => {
    return {
      error: false,
      web3Config: libs.configInternalWeb3(registryAddress, web3ProviderUrls)
    }
  },
  hedgehogConfig: {
    createKey
  },
  identityServiceUrl: Config.IDENTITY_SERVICE,
  isElectron: false,
  isMobile: true,
  legacyUserNodeUrl: Config.LEGACY_USER_NODE,
  localStorage: AsyncStorage,
  monitoringCallbacks,
  nativeMobile: Config.NATIVE_MOBILE === 'true',
  onLibsInit: (libs) => {
    audiusLibs = libs
    libsInitEventEmitter.emit(LIBS_INITTED_EVENT)
  },
  recaptchaSiteKey: Config.RECAPTCHA_SITE_KEY,
  recordAnalytics: (event: any, properties: any) =>
    track({ eventName: event, properties }),
  registryAddress: Config.REGISTRY_ADDRESS,
  remoteConfigInstance,
  setLocalStorageItem: async (key, value) => AsyncStorage.setItem(key, value),
  solanaConfig: {
    anchorAdminAccount: Config.ANCHOR_ADMIN_ACCOUNT,
    anchorProgramId: Config.ANCHOR_PROGRAM_ID,
    claimableTokenPda: Config.CLAIMABLE_TOKEN_PDA,
    claimableTokenProgramAddress: Config.CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
    rewardsManagerProgramId: Config.REWARDS_MANAGER_PROGRAM_ID,
    rewardsManagerProgramPda: Config.REWARDS_MANAGER_PROGRAM_PDA,
    rewardsManagerTokenPda: Config.REWARDS_MANAGER_TOKEN_PDA,
    solanaClusterEndpoint: Config.SOLANA_CLUSTER_ENDPOINT,
    solanaFeePayerAddress: Config.SOLANA_FEE_PAYER_ADDRESS,
    solanaTokenAddress: Config.SOLANA_TOKEN_PROGRAM_ADDRESS,
    waudioMintAddress: Config.WAUDIO_MINT_ADDRESS,
    wormholeAddress: Config.WORMHOLE_ADDRESS
  },
  userNodeUrl: Config.USER_NODE,
  web3NetworkId: Config.WEB3_NETWORK_ID,
  web3ProviderUrls: (Config.WEB3_PROVIDER_URL || '').split(','),
  waitForWeb3: async () => {},
  wormholeConfig: {
    ethBridgeAddress: Config.ETH_BRIDGE_ADDRESS,
    ethTokenBridgeAddress: Config.ETH_TOKEN_BRIDGE_ADDRESS,
    solBridgeAddress: Config.SOL_BRIDGE_ADDRESS,
    solTokenBridgeAddress: Config.SOL_TOKEN_BRIDGE_ADDRESS,
    wormholeRpcHosts: Config.WORMHOLE_RPC_HOSTS
  },
  getLibs: async () => nativeLibs,
  waitForLibsInit,
  withEagerOption: ({ normal }, ...args) => {
    if (audiusLibs) {
      return normal(audiusLibs)(...args)
    }
  }
})
