import * as nativeLibs from '@audius/sdk/dist/native-libs'
import type { AudiusLibs } from '@audius/sdk/dist/native-libs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { audiusBackend } from 'audius-client/src/common/services/audius-backend'
import Config from 'react-native-config'

import { track } from 'app/utils/analytics'

import { monitoringCallbacks } from './monitoringCallbacks'
import { getFeatureEnabled } from './remote-config'
import { remoteConfigInstance } from './remote-config/remote-config-instance'

let audiusLibs: AudiusLibs

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
  identityServiceUrl: Config.IDENTITY_SERVICE,
  isElectron: false,
  isMobile: true,
  legacyUserNodeUrl: Config.LEGACY_USER_NODE,
  localStorage: AsyncStorage,
  monitoringCallbacks,
  nativeMobile: Config.NATIVE_MOBILE === 'true',
  onLibsInit: (libs) => {
    audiusLibs = libs
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
  waitForLibsInit: async () => {},
  withEagerOption: ({ normal }, ...args) => {
    if (audiusLibs) {
      return normal(audiusLibs)(...args)
    }
  }
})
