import { audiusBackend } from '@audius/common/services'
import * as nativeLibs from '@audius/sdk/dist/native-libs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Image } from 'react-native'

import { env } from 'app/env'
import { track } from 'app/services/analytics'
import { reportToSentry } from 'app/utils/reportToSentry'

import { createPrivateKey } from './createPrivateKey'
import { withEagerOption } from './eagerLoadUtils'
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
  claimDistributionContractAddress:
    env().CLAIM_DISTRIBUTION_CONTRACT_ADDRESS ?? undefined,
  env: env(),
  ethOwnerWallet: env().ETH_OWNER_WALLET ?? undefined,
  ethProviderUrls: (env().ETH_PROVIDER_URL || '').split(','),
  ethRegistryAddress: env().ETH_REGISTRY_ADDRESS,
  ethTokenAddress: env().ETH_TOKEN_ADDRESS,
  discoveryNodeSelectorService,
  getFeatureEnabled,
  getHostUrl: () => {
    return `${env().PUBLIC_PROTOCOL}//${env().PUBLIC_HOSTNAME}`
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
  identityServiceUrl: env().IDENTITY_SERVICE,
  generalAdmissionUrl: env().GENERAL_ADMISSION,
  isElectron: false,
  localStorage: AsyncStorage,
  monitoringCallbacks,
  nativeMobile: true,
  onLibsInit: (libs) => {
    setLibs(libs)
    libsInitEventEmitter.emit(LIBS_INITTED_EVENT)
  },
  recaptchaSiteKey: env().RECAPTCHA_SITE_KEY,
  recordAnalytics: track,
  reportError: reportToSentry,
  registryAddress: env().REGISTRY_ADDRESS,
  entityManagerAddress: env().ENTITY_MANAGER_ADDRESS,
  remoteConfigInstance,
  setLocalStorageItem: async (key, value) => AsyncStorage.setItem(key, value),
  solanaConfig: {
    claimableTokenPda: env().CLAIMABLE_TOKEN_PDA,
    claimableTokenProgramAddress: env().CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
    rewardsManagerProgramId: env().REWARDS_MANAGER_PROGRAM_ID,
    rewardsManagerProgramPda: env().REWARDS_MANAGER_PROGRAM_PDA,
    rewardsManagerTokenPda: env().REWARDS_MANAGER_TOKEN_PDA,
    paymentRouterProgramId: env().PAYMENT_ROUTER_PROGRAM_ID,
    solanaClusterEndpoint: env().SOLANA_CLUSTER_ENDPOINT,
    solanaFeePayerAddress: env().SOLANA_FEE_PAYER_ADDRESS,
    solanaTokenAddress: env().SOLANA_TOKEN_PROGRAM_ADDRESS,
    waudioMintAddress: env().WAUDIO_MINT_ADDRESS,
    usdcMintAddress: env().USDC_MINT_ADDRESS,
    wormholeAddress: env().WORMHOLE_ADDRESS ?? undefined
  },
  userNodeUrl: env().USER_NODE,
  web3NetworkId: env().WEB3_NETWORK_ID,
  web3ProviderUrls: (env().WEB3_PROVIDER_URL || '').split(','),
  waitForWeb3: async () => {},
  wormholeConfig: {
    ethBridgeAddress: env().ETH_BRIDGE_ADDRESS ?? undefined,
    ethTokenBridgeAddress: env().ETH_TOKEN_BRIDGE_ADDRESS ?? undefined,
    solBridgeAddress: env().SOL_BRIDGE_ADDRESS ?? undefined,
    solTokenBridgeAddress: env().SOL_TOKEN_BRIDGE_ADDRESS ?? undefined,
    wormholeRpcHosts: env().WORMHOLE_RPC_HOSTS ?? undefined
  },
  getLibs: async () => nativeLibs,
  waitForLibsInit,
  withEagerOption,
  imagePreloader: (url: string) => Image.prefetch(url)
})
