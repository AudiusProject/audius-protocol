import { isBrowser } from 'browser-or-node'
import { OAuth } from './oauth'
import { GrantsApi } from './api/grants/GrantsApi'
import { DeveloperAppsApi } from './api/developer-apps/DeveloperAppsApi'
import { TracksApi } from './api/tracks/TracksApi'
import { ResolveApi } from './api/ResolveApi'
import { ChatsApi } from './api/chats/ChatsApi'
import {
  Configuration,
  PlaylistsApi,
  UsersApi,
  TipsApi
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
import { addAppNameMiddleware } from './middleware'
import {
  AuthService,
  DiscoveryNodeSelectorService,
  DiscoveryNodeSelector,
  EntityManagerService,
  Auth,
  StorageService,
  Storage,
  EntityManager,
  AppAuth
} from './services'

type ServicesContainer = {
  /**
   * Service used to choose discovery node
   */
  discoveryNodeSelector: DiscoveryNodeSelectorService

  /**
   * Service used to write and update entities on chain
   */
  entityManager: EntityManagerService

  /**
   * Service used to store and retrieve content e.g. tracks and images
   */
  storage: StorageService

  /**
   * Helpers to faciliate requests that require signatures or encryption
   */
  auth: AuthService
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

  /**
   * API key, required for writes
   */
  apiKey?: string

  /**
   * API secret, required for writes
   */
  apiSecret?: string
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
  if (config.apiSecret && isBrowser) {
    console.warn(
      "apiSecret should only be provided server side so that it isn't exposed"
    )
  }

  const defaultServices: ServicesContainer = {
    discoveryNodeSelector: new DiscoveryNodeSelector(),
    entityManager: new EntityManager(),
    storage: new Storage(),
    auth:
      config.apiKey && config.apiSecret
        ? new AppAuth(config.apiKey, config.apiSecret)
        : new Auth()
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
  const middleware = [
    addAppNameMiddleware({ appName }),
    services.discoveryNodeSelector.createMiddleware()
  ]
  const generatedApiClientConfig = new Configuration({
    fetchApi: fetch,
    middleware
  })

  const tracks = new TracksApi(
    generatedApiClientConfig,
    services.discoveryNodeSelector,
    services.storage,
    services.entityManager,
    services.auth
  )
  const users = new UsersApi(generatedApiClientConfig)
  const playlists = new PlaylistsApi(generatedApiClientConfig)
  const tips = new TipsApi(generatedApiClientConfig)
  const { resolve } = new ResolveApi(generatedApiClientConfig)
  const chats = new ChatsApi(
    new Configuration({
      fetchApi: fetch,
      basePath: '',
      middleware
    }),
    services.auth,
    services.discoveryNodeSelector
  )
  const grants = new GrantsApi(
    generatedApiClientConfig,
    services.entityManager,
    services.auth
  )

  const developerApps = new DeveloperAppsApi(
    generatedApiClientConfig,
    services.entityManager,
    services.auth
  )

  const generatedApiClientConfigFull = new ConfigurationFull({
    fetchApi: fetch,
    middleware
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
    chats,
    grants,
    developerApps
  }
}

export type AudiusSdk = ReturnType<typeof sdk>
