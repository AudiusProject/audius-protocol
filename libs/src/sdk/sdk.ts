import {
  DiscoveryProvider,
  DiscoveryProviderConfig
} from '../services/discoveryProvider'
import { EthContracts, EthContractsConfig } from '../services/ethContracts'
import { EthWeb3Config, EthWeb3Manager } from '../services/ethWeb3Manager'
import { IdentityService } from '../services/identity'
import { UserStateManager } from '../userStateManager'
import { Oauth } from './oauth'
import { TracksApi } from './api/TracksApi'
import { ResolveApi } from './api/ResolveApi'
import {
  Configuration,
  PlaylistsApi,
  UsersApi,
  TipsApi,
  querystring
} from './api/generated/default'
import {
  PlaylistsApi as PlaylistsApiFull,
  ReactionsApi as ReactionsApiFull,
  SearchApi as SearchApiFull,
  TracksApi as TracksApiFull,
  UsersApi as UsersApiFull,
  TipsApi as TipsApiFull
} from './api/generated/full'

import {
  CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  ETH_OWNER_WALLET,
  ETH_PROVIDER_URLS,
  ETH_REGISTRY_ADDRESS,
  ETH_TOKEN_ADDRESS,
  IDENTITY_SERVICE_ENDPOINT,
  WORMHOLE_ADDRESS
} from './constants'
import { LocalStorage } from '../utils/localStorage'

type Web3Config = {
  providers: string[]
}

type SdkConfig = {
  /**
   * Your app name
   */
  appName: string
  /**
   * Configuration for the DiscoveryProvider client
   */
  discoveryProviderConfig?: DiscoveryProviderConfig
  /**
   * Configuration for the Ethereum contracts client
   */
  ethContractsConfig?: EthContractsConfig
  /**
   * Configuration for the Ethereum Web3 client
   */
  ethWeb3Config?: EthWeb3Config
  /**
   * Configuration for the IdentityService client
   */
  identityServiceConfig?: IdentityService
  /**
   * Optional custom local storage
   */
  localStorage?: LocalStorage
  /**
   * Configuration for Web3
   */
  web3Config?: Web3Config
}

/**
 * The Audius SDK
 */
export const sdk = (config: SdkConfig) => {
  const { appName } = config

  // Initialize services
  const { discoveryProvider } = initializeServices(config)

  // Initialize APIs
  const apis = initializeApis({ appName, discoveryProvider })

  // Initialize OAuth
  const oauth =
    typeof window !== 'undefined'
      ? new Oauth({ discoveryProvider, appName })
      : undefined

  return {
    oauth,
    ...apis
  }
}

const initializeServices = (config: SdkConfig) => {
  const {
    discoveryProviderConfig,
    ethContractsConfig,
    ethWeb3Config,
    identityServiceConfig
  } = config

  const userStateManager = new UserStateManager({ localStorage })

  const identityService = new IdentityService({
    identityServiceEndpoint: IDENTITY_SERVICE_ENDPOINT,
    ...identityServiceConfig
  })

  const ethWeb3Manager = new EthWeb3Manager({
    identityService,
    web3Config: {
      ownerWallet: ETH_OWNER_WALLET,
      ...ethWeb3Config,
      providers: formatProviders(ethWeb3Config?.providers ?? ETH_PROVIDER_URLS)
    }
  })

  const ethContracts = new EthContracts({
    ethWeb3Manager,
    tokenContractAddress: ETH_TOKEN_ADDRESS,
    registryAddress: ETH_REGISTRY_ADDRESS,
    claimDistributionContractAddress: CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
    wormholeContractAddress: WORMHOLE_ADDRESS,
    ...ethContractsConfig
  })

  const discoveryProvider = new DiscoveryProvider({
    ethContracts,
    userStateManager,
    localStorage,
    ...discoveryProviderConfig
  })

  return { discoveryProvider }
}

const initializeApis = ({
  appName,
  discoveryProvider
}: {
  appName: string
  discoveryProvider: DiscoveryProvider
}) => {
  const initializationPromise = discoveryProvider.init()

  const generatedApiClientConfig = new Configuration({
    fetchApi: async (url: string) => {
      // Ensure discovery node is initialized
      await initializationPromise

      // Append the appName to the query params
      const urlWithAppName =
        url +
        (url.includes('?') ? '&' : '?') +
        querystring({ app_name: appName })

      return await discoveryProvider._makeRequest(
        {
          endpoint: urlWithAppName
        },
        undefined,
        undefined,
        // Throw errors instead of returning null
        true
      )
    }
  })

  const tracks = new TracksApi(generatedApiClientConfig, discoveryProvider)
  const users = new UsersApi(generatedApiClientConfig)
  const playlists = new PlaylistsApi(generatedApiClientConfig)
  const tips = new TipsApi(generatedApiClientConfig)
  const { resolve } = new ResolveApi(generatedApiClientConfig)

  const full = {
    tracks: new TracksApiFull(generatedApiClientConfig as any),
    users: new UsersApiFull(generatedApiClientConfig as any),
    search: new SearchApiFull(generatedApiClientConfig as any),
    playlists: new PlaylistsApiFull(generatedApiClientConfig as any),
    reactions: new ReactionsApiFull(generatedApiClientConfig as any),
    tips: new TipsApiFull(generatedApiClientConfig as any)
  }

  return {
    tracks,
    users,
    playlists,
    tips,
    resolve,
    full
  }
}

const formatProviders = (providers: string | string[]) => {
  if (typeof providers === 'string') {
    return providers.split(',')
  } else if (Array.isArray(providers)) {
    return providers
  } else {
    throw new Error('Providers must be of type string, Array, or Web3 instance')
  }
}
