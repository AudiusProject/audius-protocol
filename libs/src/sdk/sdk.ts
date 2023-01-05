import {
  DiscoveryProvider,
  DiscoveryProviderConfig
} from '../services/discoveryProvider'
import { EthContracts, EthContractsConfig } from '../services/ethContracts'
import { EthWeb3Config, EthWeb3Manager } from '../services/ethWeb3Manager'
import { IdentityService, IdentityServiceConfig } from '../services/identity'
import { UserStateManager } from '../userStateManager'
import { Oauth } from './oauth'
import { TracksApi } from './api/TracksApi'
import { ResolveApi } from './api/ResolveApi'
import { ChatsApi } from './api/chats/ChatsApi'
import {
  Configuration,
  PlaylistsApi,
  UsersApi,
  TipsApi,
  WalletAPI,
  RequiredError
} from './api/generated/default'
import {
  Configuration as ConfigurationFull,
  PlaylistsApi as PlaylistsApiFull,
  ReactionsApi as ReactionsApiFull,
  SearchApi as SearchApiFull,
  TracksApi as TracksApiFull,
  UsersApi as UsersApiFull,
  TipsApi as TipsApiFull,
  TransactionsApi as TransactionsApiFull
} from './api/generated/full'
import fetch from 'cross-fetch'

import {
  CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  ETH_OWNER_WALLET,
  ETH_PROVIDER_URLS,
  ETH_REGISTRY_ADDRESS,
  ETH_TOKEN_ADDRESS,
  IDENTITY_SERVICE_ENDPOINT,
  WORMHOLE_ADDRESS
} from './constants'
import { getPlatformLocalStorage, LocalStorage } from '../utils/localStorage'
import type { SetOptional } from 'type-fest'
import {
  addAppNameMiddleware,
  jsonResponseMiddleware,
  discoveryNodeSelectorMiddleware
} from './middleware'

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
  discoveryProviderConfig?: Omit<
    DiscoveryProviderConfig,
    'userStateManager' | 'ethContracts' | 'web3Manager'
  >
  /**
   * Configuration for the Ethereum contracts client
   */
  ethContractsConfig?: Omit<EthContractsConfig, 'ethWeb3Manager'>
  /**
   * Configuration for the Ethereum Web3 client
   */
  ethWeb3Config: SetOptional<EthWeb3Config, 'ownerWallet'>
  /**
   * Configuration for the IdentityService client
   */
  identityServiceConfig?: IdentityServiceConfig
  /**
   * Optional custom local storage
   */
  localStorage?: LocalStorage
  /**
   * Configuration for Web3
   */
  web3Config?: Web3Config
  /**
   * Helpers to faciliate requests that require signatures or encryption
   */
  walletApi?: WalletAPI
}

/**
 * Default wallet API which is used to surface errors when the walletApi is not configured
 */
const defaultWalletAPI: WalletAPI = {
  getSharedSecret: async (_: string | Uint8Array): Promise<Uint8Array> => {
    throw new RequiredError(
      'Wallet API configuration missing. This method requires using the walletApi config for write access.'
    )
  },
  sign: async (_: string): Promise<[Uint8Array, number]> => {
    throw new RequiredError(
      'Wallet API configuration missing. This method requires using the walletApi config for write access.'
    )
  }
}

/**
 * The Audius SDK
 */
export const sdk = (config: SdkConfig) => {
  const { appName, walletApi } = config

  // Initialize services
  const { discoveryProvider } = initializeServices(config)

  // Initialize APIs
  const apis = initializeApis({
    appName,
    discoveryProvider,
    walletApi: walletApi ?? defaultWalletAPI
  })

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
    identityServiceConfig,
    localStorage = getPlatformLocalStorage()
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
  discoveryProvider,
  walletApi
}: {
  appName: string
  discoveryProvider: DiscoveryProvider
  walletApi: WalletAPI
}) => {
  const defaultMiddleware = [
    addAppNameMiddleware({ appName }),
    discoveryNodeSelectorMiddleware({
      discoveryProviderSelector: discoveryProvider.serviceSelector
    })
  ]
  const generatedApiClientConfig = new Configuration({
    fetchApi: fetch,
    middleware: [
      ...defaultMiddleware,
      jsonResponseMiddleware({ extractData: true })
    ],
    walletApi
  })

  const tracks = new TracksApi(generatedApiClientConfig, discoveryProvider)
  const users = new UsersApi(generatedApiClientConfig)
  const playlists = new PlaylistsApi(generatedApiClientConfig)
  const tips = new TipsApi(generatedApiClientConfig)
  const { resolve } = new ResolveApi(generatedApiClientConfig)
  const chats = new ChatsApi(
    new Configuration({
      fetchApi: fetch,
      walletApi,
      basePath: '',
      middleware: [
        ...defaultMiddleware,
        jsonResponseMiddleware({ extractData: false })
      ]
    })
  )

  const generatedApiClientConfigFull = new ConfigurationFull({
    fetchApi: fetch,
    middleware: [
      ...defaultMiddleware,
      jsonResponseMiddleware({ extractData: true })
    ],
    walletApi
  })

  const full = {
    tracks: new TracksApiFull(generatedApiClientConfigFull),
    users: new UsersApiFull(generatedApiClientConfigFull),
    search: new SearchApiFull(generatedApiClientConfigFull),
    playlists: new PlaylistsApiFull(generatedApiClientConfigFull),
    reactions: new ReactionsApiFull(generatedApiClientConfigFull),
    tips: new TipsApiFull(generatedApiClientConfigFull),
    transactions: new TransactionsApiFull(generatedApiClientConfigFull)
  }

  return {
    tracks,
    users,
    playlists,
    tips,
    resolve,
    full,
    chats
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
