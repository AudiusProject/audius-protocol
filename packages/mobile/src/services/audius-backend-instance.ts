import { audiusBackend } from '@audius/common'
import * as nativeLibs from '@audius/sdk/dist/native-libs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Image } from 'react-native'
import Config from 'react-native-config'

import { track } from 'app/services/analytics'
import { reportToSentry } from 'app/utils/reportToSentry'

import { createPrivateKey } from './createPrivateKey'
import { withEagerOption } from './eagerLoadUtils'
import { env } from './env'
import {
  libsInitEventEmitter,
  LIBS_INITTED_EVENT,
  setLibs,
  waitForLibsInit
} from './libs'
import { monitoringCallbacks } from './monitoringCallbacks'
import { getFeatureEnabled } from './remote-config'
import { remoteConfigInstance } from './remote-config/remote-config-instance'
import { discoveryNodeSelectorService } from './sdk/discoveryNodeSelector'
import { getStorageNodeSelector } from './sdk/storageNodeSelector'

/**
 * audiusBackend initialized for a mobile environment
 */
export const audiusBackendInstance = audiusBackend({
  claimDistributionContractAddress: Config.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  env,
  ethOwnerWallet: Config.ETH_OWNER_WALLET,
  ethProviderUrls: (Config.ETH_PROVIDER_URL || '').split(','),
  ethRegistryAddress: Config.ETH_REGISTRY_ADDRESS,
  ethTokenAddress: Config.ETH_TOKEN_ADDRESS,
  discoveryNodeSelectorService,
  getFeatureEnabled,
  getHostUrl: () => {
    return `${Config.PUBLIC_PROTOCOL}//${Config.PUBLIC_HOSTNAME}`
  },
  getStorageNodeSelector,
  getWeb3Config: async (
    libs,
    registryAddress,
    entityManagerAddress,
    web3ProviderUrls
  ) => ({
    error: false,
    web3Config: libs.configInternalWeb3(
      registryAddress,
      web3ProviderUrls,
      undefined,
      entityManagerAddress
    )
  }),
  hedgehogConfig: {
    createKey: createPrivateKey
  },
  identityServiceUrl: Config.IDENTITY_SERVICE,
  generalAdmissionUrl: Config.GENERAL_ADMISSION,
  isElectron: false,
  isMobile: true,
  localStorage: AsyncStorage,
  monitoringCallbacks,
  nativeMobile: true,
  onLibsInit: (libs) => {
    setLibs(libs)
    libsInitEventEmitter.emit(LIBS_INITTED_EVENT)
  },
  recaptchaSiteKey: Config.RECAPTCHA_SITE_KEY,
  recordAnalytics: track,
  reportError: reportToSentry,
  registryAddress: Config.REGISTRY_ADDRESS,
  entityManagerAddress: Config.ENTITY_MANAGER_ADDRESS,
  remoteConfigInstance,
  setLocalStorageItem: async (key, value) => AsyncStorage.setItem(key, value),
  solanaConfig: {
    claimableTokenPda: Config.CLAIMABLE_TOKEN_PDA,
    claimableTokenProgramAddress: Config.CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
    rewardsManagerProgramId: Config.REWARDS_MANAGER_PROGRAM_ID,
    rewardsManagerProgramPda: Config.REWARDS_MANAGER_PROGRAM_PDA,
    rewardsManagerTokenPda: Config.REWARDS_MANAGER_TOKEN_PDA,
    paymentRouterProgramId: env.PAYMENT_ROUTER_PROGRAM_ID,
    solanaClusterEndpoint: Config.SOLANA_CLUSTER_ENDPOINT,
    solanaFeePayerAddress: Config.SOLANA_FEE_PAYER_ADDRESS,
    solanaTokenAddress: Config.SOLANA_TOKEN_PROGRAM_ADDRESS,
    waudioMintAddress: Config.WAUDIO_MINT_ADDRESS,
    usdcMintAddress: Config.USDC_MINT_ADDRESS,
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
  withEagerOption,
  imagePreloader: (url: string) => Image.prefetch(url)
})
