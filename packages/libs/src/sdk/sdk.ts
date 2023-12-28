import { isBrowser } from 'browser-or-node'
import fetch from 'cross-fetch'

import { ResolveApi } from './api/ResolveApi'
import { AlbumsApi } from './api/albums/AlbumsApi'
import { ChatsApi } from './api/chats/ChatsApi'
import { DashboardWalletUsersApi } from './api/dashboard-wallet-users/DashboardWalletUsersApi'
import { DeveloperAppsApi } from './api/developer-apps/DeveloperAppsApi'
import { Configuration, TipsApi } from './api/generated/default'
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
import { GrantsApi } from './api/grants/GrantsApi'
import { PlaylistsApi } from './api/playlists/PlaylistsApi'
import { TracksApi } from './api/tracks/TracksApi'
import { UsersApi } from './api/users/UsersApi'
import { addAppNameMiddleware } from './middleware'
import { OAuth } from './oauth'
import {
  DiscoveryNodeSelector,
  Auth,
  Storage,
  EntityManager,
  AppAuth,
  RewardManagerClient
} from './services'
import { defaultEntityManagerConfig } from './services/EntityManager/constants'
import { Logger } from './services/Logger'
import { StorageNodeSelector } from './services/StorageNodeSelector'
import { SdkConfig, SdkConfigSchema, ServicesContainer } from './types'
import { SolanaRelay } from './services/Solana/SolanaRelay'
import { ClaimableTokensClient } from './services/Solana/programs/ClaimableTokensClient/ClaimableTokensClient'
import { SolanaRelayWalletAdapter } from './services/Solana/SolanaRelayWalletAdapter'
import { defaultClaimableTokensConfig } from './services/Solana/programs/ClaimableTokensClient/constants'
import { defaultRewardManagerClentConfig } from './services/Solana/programs/RewardManagerClient/constants'
import { AntiAbuseOracleSelector } from './services/AntiAbuseOracleSelector/AntiAbuseOracleSelector'
import { ChallengesApi } from './api/challenges/ChallengesApi'

/**
 * The Audius SDK
 */
export const sdk = (config: SdkConfig) => {
  SdkConfigSchema.parse(config)
  const { appName, apiKey } = config

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
      ? new OAuth({
          appName,
          apiKey,
          usersApi: apis.users,
          logger: services.logger
        })
      : undefined

  return {
    oauth,
    ...apis
  }
}

const initializeServices = (config: SdkConfig) => {
  const defaultLogger = new Logger()
  const logger = config.services?.logger ?? defaultLogger

  if (config.apiSecret && isBrowser) {
    logger.warn(
      "apiSecret should only be provided server side so that it isn't exposed"
    )
  }

  const defaultAuthService = config.apiKey
    ? new AppAuth(config.apiKey, config.apiSecret)
    : new Auth()

  const defaultDiscoveryNodeSelector = new DiscoveryNodeSelector({ logger })

  const storageNodeSelector =
    config.services?.storageNodeSelector ??
    new StorageNodeSelector({
      auth: config.services?.auth ?? defaultAuthService,
      discoveryNodeSelector:
        config.services?.discoveryNodeSelector ?? defaultDiscoveryNodeSelector,
      logger
    })

  const defaultEntityManager = new EntityManager({
    ...defaultEntityManagerConfig,
    discoveryNodeSelector:
      config.services?.discoveryNodeSelector ?? defaultDiscoveryNodeSelector
  })

  const defaultStorage = new Storage({ storageNodeSelector, logger })

  const defaultAntiAbuseOracleSelector = new AntiAbuseOracleSelector({ logger })

  const defaultSolanaRelay = new SolanaRelay({
    middleware: [
      config.services?.discoveryNodeSelector?.createMiddleware() ??
        defaultDiscoveryNodeSelector.createMiddleware()
    ]
  })

  const defaultSolanaWalletAdapter = new SolanaRelayWalletAdapter({
    solanaRelay: config.services?.solanaRelay ?? defaultSolanaRelay
  })

  const defaultClaimableTokensProgram = new ClaimableTokensClient({
    ...defaultClaimableTokensConfig,
    solanaWalletAdapter:
      config.services?.solanaWalletAdapter ?? defaultSolanaWalletAdapter
  })

  const defaultRewardManagerProgram = new RewardManagerClient({
    ...defaultRewardManagerClentConfig,
    solanaWalletAdapter:
      config.services?.solanaWalletAdapter ?? defaultSolanaWalletAdapter
  })

  const defaultServices: ServicesContainer = {
    storageNodeSelector,
    discoveryNodeSelector: defaultDiscoveryNodeSelector,
    entityManager: defaultEntityManager,
    storage: defaultStorage,
    auth: defaultAuthService,
    claimableTokensProgram: defaultClaimableTokensProgram,
    rewardManagerProgram: defaultRewardManagerProgram,
    solanaWalletAdapter: defaultSolanaWalletAdapter,
    solanaRelay: defaultSolanaRelay,
    antiAbuseOracleSelector: defaultAntiAbuseOracleSelector,
    logger
  }
  return { ...defaultServices, ...config.services }
}

const initializeApis = ({
  appName,
  services
}: {
  appName?: string
  services: ServicesContainer
}) => {
  const middleware = [
    addAppNameMiddleware({ appName, services }),
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
    services.auth,
    services.logger
  )
  const users = new UsersApi(
    generatedApiClientConfig,
    services.discoveryNodeSelector,
    services.storage,
    services.entityManager,
    services.auth,
    services.logger,
    services.claimableTokensProgram
  )
  const albums = new AlbumsApi(
    generatedApiClientConfig,
    services.storage,
    services.entityManager,
    services.auth,
    services.logger
  )
  const playlists = new PlaylistsApi(
    generatedApiClientConfig,
    services.storage,
    services.entityManager,
    services.auth,
    services.logger
  )
  const tips = new TipsApi(generatedApiClientConfig)
  const { resolve } = new ResolveApi(generatedApiClientConfig)
  const chats = new ChatsApi(
    new Configuration({
      fetchApi: fetch,
      basePath: '',
      middleware
    }),
    services.auth,
    services.discoveryNodeSelector,
    services.logger
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

  const dashboardWalletUsers = new DashboardWalletUsersApi(
    generatedApiClientConfig,
    services.entityManager,
    services.auth
  )

  const challenges = new ChallengesApi(
    generatedApiClientConfig,
    users,
    services.discoveryNodeSelector,
    services.rewardManagerProgram,
    services.claimableTokensProgram,
    services.antiAbuseOracleSelector,
    services.logger
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
    albums,
    playlists,
    tips,
    resolve,
    full,
    chats,
    grants,
    developerApps,
    dashboardWalletUsers,
    challenges,
    services
  }
}

export type AudiusSdk = ReturnType<typeof sdk>
