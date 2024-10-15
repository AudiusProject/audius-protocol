import { audiusBackend } from '@audius/common/services'
import type { AudiusLibs } from '@audius/sdk-legacy/dist/libs'

import { track } from 'services/analytics'
import {
  LIBS_INITTED_EVENT,
  waitForLibsInit,
  withEagerOption
} from 'services/audius-backend/eagerLoadUtils'
import { discoveryNodeSelectorService } from 'services/audius-sdk/discoveryNodeSelector'
import { getStorageNodeSelector } from 'services/audius-sdk/storageNodeSelector'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { monitoringCallbacks } from 'services/serviceMonitoring'
import { reportToSentry } from 'store/errors/reportToSentry'
import { isElectron } from 'utils/clientUtil'
import { preload } from 'utils/image'

import { env } from '../env'

declare global {
  interface Window {
    audiusLibs: AudiusLibs
  }
}

/**
 * audiusBackend initialized for a web environment
 */
export const audiusBackendInstance = audiusBackend({
  claimDistributionContractAddress:
    env.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS ?? undefined,
  env,
  ethOwnerWallet: env.ETH_OWNER_WALLET ?? undefined,
  ethProviderUrls: (env.ETH_PROVIDER_URL || '').split(','),
  ethRegistryAddress: env.ETH_REGISTRY_ADDRESS,
  ethTokenAddress: env.ETH_TOKEN_ADDRESS,
  getFeatureEnabled,
  getHostUrl: () => window.location.origin,
  getLibs: () => import('@audius/sdk-legacy/dist/web-libs'),
  discoveryNodeSelectorService,
  getStorageNodeSelector,
  getWeb3Config: async (
    libs,
    registryAddress,
    entityManagerAddress,
    web3ProviderUrls,
    web3NetworkId
  ) => {
    const useMetaMaskSerialized = localStorage.getItem('useMetaMask')
    const useMetaMask = useMetaMaskSerialized
      ? JSON.parse(useMetaMaskSerialized)
      : false

    if (useMetaMask && window.ethereum) {
      try {
        return {
          error: false,
          web3Config: await libs.configExternalWeb3(
            registryAddress,
            window.ethereum,
            web3NetworkId,
            null,
            entityManagerAddress
          )
        }
      } catch (e) {
        return {
          error: true,
          web3Config: libs.configInternalWeb3(
            registryAddress,
            web3ProviderUrls,
            null,
            entityManagerAddress
          )
        }
      }
    }
    return {
      error: false,
      web3Config: libs.configInternalWeb3(
        registryAddress,
        web3ProviderUrls,
        null,
        entityManagerAddress
      )
    }
  },
  identityServiceUrl: env.IDENTITY_SERVICE,
  generalAdmissionUrl: env.GENERAL_ADMISSION,
  isElectron: isElectron(),
  monitoringCallbacks,
  nativeMobile: false,
  onLibsInit: (libs: AudiusLibs) => {
    window.audiusLibs = libs
    const event = new CustomEvent(LIBS_INITTED_EVENT)
    window.dispatchEvent(event)
  },
  recaptchaSiteKey: env.RECAPTCHA_SITE_KEY,
  recordAnalytics: track,
  reportError: reportToSentry,
  registryAddress: env.REGISTRY_ADDRESS,
  entityManagerAddress: env.ENTITY_MANAGER_ADDRESS,
  remoteConfigInstance,
  setLocalStorageItem: async (key, value) =>
    window.localStorage.setItem(key, value),
  solanaConfig: {
    claimableTokenPda: env.CLAIMABLE_TOKEN_PDA,
    claimableTokenProgramAddress: env.CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
    rewardsManagerProgramId: env.REWARDS_MANAGER_PROGRAM_ID,
    rewardsManagerProgramPda: env.REWARDS_MANAGER_PROGRAM_PDA,
    rewardsManagerTokenPda: env.REWARDS_MANAGER_TOKEN_PDA,
    paymentRouterProgramId: env.PAYMENT_ROUTER_PROGRAM_ID,
    solanaClusterEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
    solanaFeePayerAddress: env.SOLANA_FEE_PAYER_ADDRESS,
    solanaTokenAddress: env.SOLANA_TOKEN_PROGRAM_ADDRESS,
    waudioMintAddress: env.WAUDIO_MINT_ADDRESS,
    usdcMintAddress: env.USDC_MINT_ADDRESS,
    wormholeAddress: env.WORMHOLE_ADDRESS ?? undefined
  },
  userNodeUrl: env.USER_NODE,
  web3NetworkId: env.WEB3_NETWORK_ID,
  web3ProviderUrls: (env.WEB3_PROVIDER_URL || '').split(','),
  waitForLibsInit,
  waitForWeb3: async () => {
    if (!window.web3Loaded) {
      await new Promise<void>((resolve) => {
        const onLoad = () => {
          window.removeEventListener('WEB3_LOADED', onLoad)
          resolve()
        }
        window.addEventListener('WEB3_LOADED', onLoad)
      })
    }
  },

  withEagerOption,
  wormholeConfig: {
    ethBridgeAddress: env.ETH_BRIDGE_ADDRESS ?? undefined,
    ethTokenBridgeAddress: env.ETH_TOKEN_BRIDGE_ADDRESS ?? undefined,
    solBridgeAddress: env.SOL_BRIDGE_ADDRESS ?? undefined,
    solTokenBridgeAddress: env.SOL_TOKEN_BRIDGE_ADDRESS ?? undefined,
    wormholeRpcHosts: env.WORMHOLE_RPC_HOSTS ?? undefined
  },
  imagePreloader: preload
})
