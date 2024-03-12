import { isBrowser } from 'browser-or-node'
import fetch from 'cross-fetch'

import { ResolveApi } from './api/ResolveApi'
import { AlbumsApi } from './api/albums/AlbumsApi'
import { ChallengesApi } from './api/challenges/ChallengesApi'
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
import {
  addAppNameMiddleware,
  addRequestSignatureMiddleware
} from './middleware'
import { OAuth } from './oauth'
import {
  DiscoveryNodeSelector,
  DefaultAuth,
  Storage,
  EntityManager,
  AppAuth,
  RewardManagerClient
} from './services'
import { AntiAbuseOracle } from './services/AntiAbuseOracle/AntiAbuseOracle'
import { AntiAbuseOracleSelector } from './services/AntiAbuseOracleSelector/AntiAbuseOracleSelector'
import { defaultEntityManagerConfig } from './services/EntityManager/constants'
import { Logger } from './services/Logger'
import { SolanaRelay } from './services/Solana/SolanaRelay'
import { SolanaRelayWalletAdapter } from './services/Solana/SolanaRelayWalletAdapter'
import { ClaimableTokensClient } from './services/Solana/programs/ClaimableTokensClient/ClaimableTokensClient'
import { defaultClaimableTokensConfig } from './services/Solana/programs/ClaimableTokensClient/constants'
import { defaultRewardManagerClentConfig } from './services/Solana/programs/RewardManagerClient/constants'
import { StorageNodeSelector } from './services/StorageNodeSelector'
import { SdkConfig, SdkConfigSchema, ServicesContainer } from './types'

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

  const auth =
    config.services?.auth ??
    (config.apiKey && config.apiSecret
      ? new AppAuth(config.apiKey, config.apiSecret)
      : new DefaultAuth(config.apiKey))

  const discoveryNodeSelector =
    config.services?.discoveryNodeSelector ??
    new DiscoveryNodeSelector({ logger })

  const storageNodeSelector =
    config.services?.storageNodeSelector ??
    new StorageNodeSelector({
      auth,
      discoveryNodeSelector,
      logger
    })

  const defaultEntityManager = new EntityManager({
    ...defaultEntityManagerConfig,
    discoveryNodeSelector
  })

  const defaultStorage = new Storage({ storageNodeSelector, logger })

  const antiAbuseOracleSelector =
    config.services?.antiAbuseOracleSelector ??
    new AntiAbuseOracleSelector({ logger })

  const defaultSolanaRelay = new SolanaRelay(
    new Configuration({
      middleware: [discoveryNodeSelector.createMiddleware()]
    })
  )

  const defaultSolanaWalletAdapter = new SolanaRelayWalletAdapter({
    solanaRelay: config.services?.solanaRelay ?? defaultSolanaRelay
  })

  const claimableTokensClient =
    config.services?.claimableTokensClient ??
    new ClaimableTokensClient({
      ...defaultClaimableTokensConfig,
      solanaWalletAdapter:
        config.services?.solanaWalletAdapter ?? defaultSolanaWalletAdapter
    })

  const rewardManagerClient =
    config.services?.rewardManagerClient ??
    new RewardManagerClient({
      ...defaultRewardManagerClentConfig,
      solanaWalletAdapter:
        config.services?.solanaWalletAdapter ?? defaultSolanaWalletAdapter
    })

  const defaultAntiAbuseOracle = new AntiAbuseOracle({
    antiAbuseOracleSelector
  })

  const defaultServices: ServicesContainer = {
    storageNodeSelector,
    discoveryNodeSelector,
    antiAbuseOracleSelector,
    entityManager: defaultEntityManager,
    storage: defaultStorage,
    auth,
    claimableTokensClient,
    rewardManagerClient,
    solanaWalletAdapter: defaultSolanaWalletAdapter,
    solanaRelay: defaultSolanaRelay,
    antiAbuseOracle: defaultAntiAbuseOracle,
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
    addRequestSignatureMiddleware({ services }),
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
    services.claimableTokensClient
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
    services.rewardManagerClient,
    services.claimableTokensClient,
    services.antiAbuseOracle,
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
