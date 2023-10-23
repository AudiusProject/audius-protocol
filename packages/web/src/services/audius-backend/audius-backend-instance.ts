import { audiusBackend } from '@audius/common'
import type { AudiusLibs } from '@audius/sdk'

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
import { isElectron, isMobile } from 'utils/clientUtil'

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
  claimDistributionContractAddress: import.meta.env
    .VITE_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  env,
  ethOwnerWallet: import.meta.env.VITE_ETH_OWNER_WALLET,
  ethProviderUrls: (import.meta.env.VITE_ETH_PROVIDER_URL || '').split(','),
  ethRegistryAddress: import.meta.env.VITE_ETH_REGISTRY_ADDRESS,
  ethTokenAddress: import.meta.env.VITE_ETH_TOKEN_ADDRESS,
  getFeatureEnabled,
  getHostUrl: () => window.location.origin,
  getLibs: () => import('@audius/sdk/dist/web-libs'),
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
  identityServiceUrl: import.meta.env.VITE_IDENTITY_SERVICE,
  generalAdmissionUrl: import.meta.env.VITE_GENERAL_ADMISSION,
  isElectron: isElectron(),
  isMobile: isMobile(),
  monitoringCallbacks,
  nativeMobile: false,
  onLibsInit: (libs: AudiusLibs) => {
    window.audiusLibs = libs
    const event = new CustomEvent(LIBS_INITTED_EVENT)
    window.dispatchEvent(event)
  },
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  recordAnalytics: track,
  reportError: reportToSentry,
  registryAddress: import.meta.env.VITE_REGISTRY_ADDRESS,
  entityManagerAddress: import.meta.env.VITE_ENTITY_MANAGER_ADDRESS,
  remoteConfigInstance,
  setLocalStorageItem: async (key, value) =>
    window.localStorage.setItem(key, value),
  solanaConfig: {
    claimableTokenPda: import.meta.env.VITE_CLAIMABLE_TOKEN_PDA,
    claimableTokenProgramAddress: import.meta.env
      .VITE_CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
    rewardsManagerProgramId: import.meta.env.VITE_REWARDS_MANAGER_PROGRAM_ID,
    rewardsManagerProgramPda: import.meta.env.VITE_REWARDS_MANAGER_PROGRAM_PDA,
    rewardsManagerTokenPda: import.meta.env.VITE_REWARDS_MANAGER_TOKEN_PDA,
    solanaClusterEndpoint: import.meta.env.VITE_SOLANA_CLUSTER_ENDPOINT,
    solanaFeePayerAddress: import.meta.env.VITE_SOLANA_FEE_PAYER_ADDRESS,
    solanaTokenAddress: import.meta.env.VITE_SOLANA_TOKEN_PROGRAM_ADDRESS,
    waudioMintAddress: import.meta.env.VITE_WAUDIO_MINT_ADDRESS,
    usdcMintAddress: import.meta.env.VITE_USDC_MINT_ADDRESS,
    wormholeAddress: import.meta.env.VITE_WORMHOLE_ADDRESS
  },
  userNodeUrl: import.meta.env.VITE_USER_NODE,
  web3NetworkId: import.meta.env.VITE_WEB3_NETWORK_ID,
  web3ProviderUrls: (import.meta.env.VITE_WEB3_PROVIDER_URL || '').split(','),
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
    ethBridgeAddress: import.meta.env.VITE_ETH_BRIDGE_ADDRESS,
    ethTokenBridgeAddress: import.meta.env.VITE_ETH_TOKEN_BRIDGE_ADDRESS,
    solBridgeAddress: import.meta.env.VITE_SOL_BRIDGE_ADDRESS,
    solTokenBridgeAddress: import.meta.env.VITE_SOL_TOKEN_BRIDGE_ADDRESS,
    wormholeRpcHosts: import.meta.env.VITE_WORMHOLE_RPC_HOSTS
  }
})
