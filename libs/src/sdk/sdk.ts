import { OAuth } from './oauth'
import { TracksApi } from './api/TracksApi'
import { ResolveApi } from './api/ResolveApi'
import { ChatsApi } from './api/chats/ChatsApi'
import {
  Configuration,
  PlaylistsApi,
  UsersApi,
  TipsApi,
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

import { addAppNameMiddleware, jsonResponseMiddleware } from './middleware'
import { DiscoveryNodeSelector } from './services/DiscoveryNodeSelector/DiscoveryNodeSelector'
import type { WalletApiService } from './services/WalletApi'

type ServicesContainer = {
  discoveryNodeSelector: DiscoveryNodeSelector
  /**
   * Helpers to faciliate requests that require signatures or encryption
   */
  walletApi: WalletApiService
}

type SdkConfig = {
  /**
   * Your app name
   */
  appName: string
  /**
   * Services injection
   */
  services?: Partial<ServicesContainer>
}

/**
 * Default wallet API which is used to surface errors when the walletApi is not configured
 */
const defaultWalletAPI: WalletApiService = {
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
  const { appName } = config

  // Initialize services
  const services = initializeServices(config)

  // Initialize APIs
  const apis = initializeApis({
    appName,
    services
  })

  // Initialize OAuth
  const oauth =
    typeof window !== 'undefined'
      ? new OAuth({ appName, usersApi: apis.users })
      : undefined

  return {
    oauth,
    ...apis
  }
}

const initializeServices = (config: SdkConfig) => {
  const defaultServices: ServicesContainer = {
    discoveryNodeSelector: new DiscoveryNodeSelector({
      bootstrapServices: []
    }),
    walletApi: defaultWalletAPI
  }
  return { ...defaultServices, ...config.services }
}

const initializeApis = ({
  appName,
  services
}: {
  appName: string
  services: ServicesContainer
}) => {
  const defaultMiddleware = [
    addAppNameMiddleware({ appName }),
    services.discoveryNodeSelector.createMiddleware()
  ]
  const generatedApiClientConfig = new Configuration({
    fetchApi: fetch,
    middleware: [
      ...defaultMiddleware,
      jsonResponseMiddleware({ extractData: true })
    ]
  })

  const tracks = new TracksApi(
    generatedApiClientConfig,
    services.discoveryNodeSelector
  )
  const users = new UsersApi(generatedApiClientConfig)
  const playlists = new PlaylistsApi(generatedApiClientConfig)
  const tips = new TipsApi(generatedApiClientConfig)
  const { resolve } = new ResolveApi(generatedApiClientConfig)
  const chats = new ChatsApi(
    new Configuration({
      fetchApi: fetch,
      basePath: '',
      middleware: [
        ...defaultMiddleware,
        jsonResponseMiddleware({ extractData: false })
      ]
    }),
    services.walletApi,
    services.discoveryNodeSelector
  )

  const generatedApiClientConfigFull = new ConfigurationFull({
    fetchApi: fetch,
    middleware: [
      ...defaultMiddleware,
      jsonResponseMiddleware({ extractData: true })
    ]
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
