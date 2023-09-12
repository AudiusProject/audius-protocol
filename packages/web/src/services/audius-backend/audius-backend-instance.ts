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
  claimDistributionContractAddress:
    process.env.REACT_APP_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  env,
  ethOwnerWallet: process.env.REACT_APP_ETH_OWNER_WALLET,
  ethProviderUrls: (process.env.REACT_APP_ETH_PROVIDER_URL || '').split(','),
  ethRegistryAddress: process.env.REACT_APP_ETH_REGISTRY_ADDRESS,
  ethTokenAddress: process.env.REACT_APP_ETH_TOKEN_ADDRESS,
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
  identityServiceUrl: process.env.REACT_APP_IDENTITY_SERVICE,
  generalAdmissionUrl: process.env.REACT_APP_GENERAL_ADMISSION,
  isElectron: isElectron(),
  isMobile: isMobile(),
  monitoringCallbacks,
  nativeMobile: false,
  onLibsInit: (libs: AudiusLibs) => {
    window.audiusLibs = libs
    const event = new CustomEvent(LIBS_INITTED_EVENT)
    window.dispatchEvent(event)
  },
  recaptchaSiteKey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
  recordAnalytics: track,
  reportError: reportToSentry,
  registryAddress: process.env.REACT_APP_REGISTRY_ADDRESS,
  entityManagerAddress: process.env.REACT_APP_ENTITY_MANAGER_ADDRESS,
  remoteConfigInstance,
  setLocalStorageItem: async (key, value) =>
    window.localStorage.setItem(key, value),
  solanaConfig: {
    claimableTokenPda: process.env.REACT_APP_CLAIMABLE_TOKEN_PDA,
    claimableTokenProgramAddress:
      process.env.REACT_APP_CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
    rewardsManagerProgramId: process.env.REACT_APP_REWARDS_MANAGER_PROGRAM_ID,
    rewardsManagerProgramPda: process.env.REACT_APP_REWARDS_MANAGER_PROGRAM_PDA,
    rewardsManagerTokenPda: process.env.REACT_APP_REWARDS_MANAGER_TOKEN_PDA,
    solanaClusterEndpoint: process.env.REACT_APP_SOLANA_CLUSTER_ENDPOINT,
    solanaFeePayerAddress: process.env.REACT_APP_SOLANA_FEE_PAYER_ADDRESS,
    solanaTokenAddress: process.env.REACT_APP_SOLANA_TOKEN_PROGRAM_ADDRESS,
    waudioMintAddress: process.env.REACT_APP_WAUDIO_MINT_ADDRESS,
    usdcMintAddress: process.env.REACT_APP_USDC_MINT_ADDRESS,
    wormholeAddress: process.env.REACT_APP_WORMHOLE_ADDRESS
  },
  userNodeUrl: process.env.REACT_APP_USER_NODE,
  web3NetworkId: process.env.REACT_APP_WEB3_NETWORK_ID,
  web3ProviderUrls: (process.env.REACT_APP_WEB3_PROVIDER_URL || '').split(','),
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
    ethBridgeAddress: process.env.REACT_APP_ETH_BRIDGE_ADDRESS,
    ethTokenBridgeAddress: process.env.REACT_APP_ETH_TOKEN_BRIDGE_ADDRESS,
    solBridgeAddress: process.env.REACT_APP_SOL_BRIDGE_ADDRESS,
    solTokenBridgeAddress: process.env.REACT_APP_SOL_TOKEN_BRIDGE_ADDRESS,
    wormholeRpcHosts: process.env.REACT_APP_WORMHOLE_RPC_HOSTS
  }
})
