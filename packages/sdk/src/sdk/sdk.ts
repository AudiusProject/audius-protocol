import { isBrowser } from 'browser-or-node'
import { createPublicClient, createWalletClient, http, type Hex } from 'viem'
import { mainnet } from 'viem/chains'

import { ResolveApi } from './api/ResolveApi'
import { AlbumsApi } from './api/albums/AlbumsApi'
import { ChallengesApi } from './api/challenges/ChallengesApi'
import { ChatsApi } from './api/chats/ChatsApi'
import { CommentsApi } from './api/comments/CommentsAPI'
import { DashboardWalletUsersApi } from './api/dashboard-wallet-users/DashboardWalletUsersApi'
import { DeveloperAppsApi } from './api/developer-apps/DeveloperAppsApi'
import { Configuration, TipsApi } from './api/generated/default'
import {
  TracksApi as TracksApiFull,
  Configuration as ConfigurationFull,
  PlaylistsApi as PlaylistsApiFull,
  ReactionsApi as ReactionsApiFull,
  SearchApi as SearchApiFull,
  UsersApi as UsersApiFull,
  TipsApi as TipsApiFull,
  TransactionsApi as TransactionsApiFull,
  NotificationsApi as NotificationsApiFull
} from './api/generated/full'
import { GrantsApi } from './api/grants/GrantsApi'
import { PlaylistsApi } from './api/playlists/PlaylistsApi'
import { TracksApi } from './api/tracks/TracksApi'
import { UsersApi } from './api/users/UsersApi'
import { developmentConfig } from './config/development'
import { productionConfig } from './config/production'
import { stagingConfig } from './config/staging'
import {
  addAppInfoMiddleware,
  addRequestSignatureMiddleware
} from './middleware'
import { OAuth } from './oauth'
import {
  PaymentRouterClient,
  getDefaultPaymentRouterClientConfig
} from './services'
import { AntiAbuseOracle } from './services/AntiAbuseOracle/AntiAbuseOracle'
import { getDefaultAntiAbuseOracleSelectorConfig } from './services/AntiAbuseOracleSelector'
import { AntiAbuseOracleSelector } from './services/AntiAbuseOracleSelector/AntiAbuseOracleSelector'
import { createAppWalletClient } from './services/AudiusWalletClient'
import {
  DiscoveryNodeSelector,
  getDefaultDiscoveryNodeSelectorConfig
} from './services/DiscoveryNodeSelector'
import {
  EntityManager,
  getDefaultEntityManagerConfig
} from './services/EntityManager'
import {
  EthRewardsManagerClient,
  getDefaultEthRewardsManagerConfig,
  getDefaultServiceProviderFactoryConfig,
  getDefaultServiceTypeManagerConfig,
  ServiceProviderFactoryClient,
  ServiceTypeManagerClient,
  AudiusTokenClient,
  getDefaultAudiusTokenConfig,
  ClaimsManagerClient,
  getDefaultClaimsManagerConfig,
  DelegateManagerClient,
  getDefaultDelegateManagerConfig,
  StakingClient,
  getDefaultStakingConfig,
  TrustedNotifierManagerClient,
  getDefaultTrustedNotifierManagerConfig,
  AudiusWormholeClient,
  getDefaultWormholeConfig,
  RegistryClient,
  getDefaultRegistryConfig,
  GovernanceClient,
  getDefaultGovernanceConfig
} from './services/Ethereum'
import { Logger } from './services/Logger'
import { SolanaRelay } from './services/Solana/SolanaRelay'
import { SolanaRelayWalletAdapter } from './services/Solana/SolanaRelayWalletAdapter'
import {
  getDefaultClaimableTokensConfig,
  ClaimableTokensClient
} from './services/Solana/programs/ClaimableTokensClient'
import {
  RewardManagerClient,
  getDefaultRewardManagerClentConfig
} from './services/Solana/programs/RewardManagerClient'
import { SolanaClient } from './services/Solana/programs/SolanaClient'
import { getDefaultSolanaClientConfig } from './services/Solana/programs/getDefaultConfig'
import { Storage, getDefaultStorageServiceConfig } from './services/Storage'
import {
  StorageNodeSelector,
  getDefaultStorageNodeSelectorConfig
} from './services/StorageNodeSelector'
import { SdkConfig, SdkConfigSchema, ServicesContainer } from './types'
import fetch from './utils/fetch'

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
    apiKey,
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
  const servicesConfig =
    config.environment === 'development'
      ? developmentConfig
      : config.environment === 'staging'
      ? stagingConfig
      : productionConfig

  const defaultLogger = new Logger({
    logLevel: config.environment !== 'production' ? 'debug' : undefined
  })
  const logger = config.services?.logger ?? defaultLogger

  if (config.apiSecret && isBrowser) {
    logger.warn(
      "apiSecret should only be provided server side so that it isn't exposed"
    )
  }
  const audiusWalletClient =
    config.services?.audiusWalletClient ??
    createAppWalletClient(config.apiKey as Hex, config.apiSecret as Hex)

  const ethPublicClient =
    config.services?.ethPublicClient ??
    createPublicClient({
      chain: mainnet,
      transport: http(servicesConfig.ethereum.rpcEndpoint)
    })

  const ethWalletClient =
    config.services?.ethWalletClient ??
    createWalletClient({
      chain: mainnet,
      transport: http(servicesConfig.ethereum.rpcEndpoint)
    })

  const discoveryNodeSelector =
    config.services?.discoveryNodeSelector ??
    new DiscoveryNodeSelector({
      ...getDefaultDiscoveryNodeSelectorConfig(servicesConfig),
      logger
    })

  const storageNodeSelector =
    config.services?.storageNodeSelector ??
    new StorageNodeSelector({
      ...getDefaultStorageNodeSelectorConfig(servicesConfig),
      audiusWalletClient,
      discoveryNodeSelector,
      logger
    })

  const entityManager =
    config.services?.entityManager ??
    new EntityManager({
      ...getDefaultEntityManagerConfig(servicesConfig),
      discoveryNodeSelector,
      audiusWalletClient,
      logger
    })

  const storage =
    config.services?.storage ??
    new Storage({
      ...getDefaultStorageServiceConfig(servicesConfig),
      storageNodeSelector,
      audiusWalletClient,
      logger
    })

  const antiAbuseOracleSelector =
    config.services?.antiAbuseOracleSelector ??
    new AntiAbuseOracleSelector({
      ...getDefaultAntiAbuseOracleSelectorConfig(servicesConfig),
      logger
    })

  const antiAbuseOracle =
    config.services?.antiAbuseOracle ??
    new AntiAbuseOracle({
      antiAbuseOracleSelector
    })

  /* Solana Programs */
  const solanaRelay = config.services?.solanaRelay
    ? config.services.solanaRelay.withMiddleware(
        addRequestSignatureMiddleware({
          services: { audiusWalletClient, logger }
        })
      )
    : new SolanaRelay(
        new Configuration({
          middleware: [
            addRequestSignatureMiddleware({
              services: { audiusWalletClient, logger }
            }),
            discoveryNodeSelector.createMiddleware()
          ]
        })
      )

  const solanaWalletAdapter =
    config.services?.solanaWalletAdapter ??
    new SolanaRelayWalletAdapter({
      solanaRelay
    })

  const solanaClient =
    config.services?.solanaClient ??
    new SolanaClient({
      ...getDefaultSolanaClientConfig(servicesConfig),
      solanaWalletAdapter
    })

  const claimableTokensClient =
    config.services?.claimableTokensClient ??
    new ClaimableTokensClient({
      ...getDefaultClaimableTokensConfig(servicesConfig),
      solanaClient,
      audiusWalletClient,
      logger
    })

  const rewardManagerClient =
    config.services?.rewardManagerClient ??
    new RewardManagerClient({
      ...getDefaultRewardManagerClentConfig(servicesConfig),
      solanaClient,
      logger
    })

  const paymentRouterClient =
    config.services?.paymentRouterClient ??
    new PaymentRouterClient({
      ...getDefaultPaymentRouterClientConfig(servicesConfig),
      solanaClient
    })

  /* Ethereum Contracts */
  const audiusTokenClient =
    config.services?.audiusTokenClient ??
    new AudiusTokenClient({
      audiusWalletClient,
      ethPublicClient,
      ethWalletClient,
      ...getDefaultAudiusTokenConfig(servicesConfig)
    })

  const claimsManagerClient =
    config.services?.claimsManagerClient ??
    new ClaimsManagerClient({
      ...getDefaultClaimsManagerConfig(servicesConfig)
    })

  const delegateManagerClient =
    config.services?.delegateManagerClient ??
    new DelegateManagerClient({
      ...getDefaultDelegateManagerConfig(servicesConfig)
    })

  const stakingClient =
    config.services?.stakingClient ??
    new StakingClient({
      ...getDefaultStakingConfig(servicesConfig)
    })

  const trustedNotifierManagerClient =
    config.services?.trustedNotifierManagerClient ??
    new TrustedNotifierManagerClient({
      ...getDefaultTrustedNotifierManagerConfig(servicesConfig)
    })

  const audiusWormholeClient =
    config.services?.audiusWormholeClient ??
    new AudiusWormholeClient({
      audiusWalletClient,
      ethPublicClient,
      ethWalletClient,
      ...getDefaultWormholeConfig(servicesConfig)
    })

  const registryClient =
    config.services?.registryClient ??
    new RegistryClient({
      ...getDefaultRegistryConfig(servicesConfig)
    })

  const governanceClient =
    config.services?.governanceClient ??
    new GovernanceClient({
      ...getDefaultGovernanceConfig(servicesConfig)
    })

  const serviceTypeManagerClient =
    config.services?.serviceTypeManagerClient ??
    new ServiceTypeManagerClient({
      ...getDefaultServiceTypeManagerConfig(servicesConfig)
    })

  const serviceProviderFactoryClient =
    config.services?.serviceProviderFactoryClient ??
    new ServiceProviderFactoryClient({
      ...getDefaultServiceProviderFactoryConfig(servicesConfig)
    })

  const ethRewardsManagerClient =
    config.services?.ethRewardsManagerClient ??
    new EthRewardsManagerClient({
      ...getDefaultEthRewardsManagerConfig(servicesConfig)
    })

  const services: ServicesContainer = {
    storageNodeSelector,
    discoveryNodeSelector,
    antiAbuseOracleSelector,
    entityManager,
    storage,
    audiusWalletClient,
    ethPublicClient,
    ethWalletClient,
    claimableTokensClient,
    rewardManagerClient,
    paymentRouterClient,
    solanaClient,
    solanaWalletAdapter,
    solanaRelay,
    antiAbuseOracle,
    audiusTokenClient,
    claimsManagerClient,
    delegateManagerClient,
    stakingClient,
    trustedNotifierManagerClient,
    audiusWormholeClient,
    registryClient,
    governanceClient,
    serviceTypeManagerClient,
    serviceProviderFactoryClient,
    ethRewardsManagerClient,
    logger
  }
  return services
}

const initializeApis = ({
  apiKey,
  appName,
  services
}: {
  apiKey?: string
  appName?: string
  services: ServicesContainer
}) => {
  const middleware = [
    addAppInfoMiddleware({ apiKey, appName, services }),
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
    services.logger,
    services.claimableTokensClient,
    services.paymentRouterClient,
    services.solanaRelay,
    services.solanaClient
  )
  const users = new UsersApi(
    generatedApiClientConfig,
    services.storage,
    services.entityManager,
    services.logger,
    services.claimableTokensClient,
    services.solanaClient
  )
  const albums = new AlbumsApi(
    generatedApiClientConfig,
    services.storage,
    services.entityManager,
    services.logger,
    services.claimableTokensClient,
    services.paymentRouterClient,
    services.solanaRelay,
    services.solanaClient
  )
  const playlists = new PlaylistsApi(
    generatedApiClientConfig,
    services.storage,
    services.entityManager,
    services.logger
  )
  const comments = new CommentsApi(
    generatedApiClientConfig,
    services.entityManager,
    services.logger
  )
  const tips = new TipsApi(generatedApiClientConfig)
  const resolveApi = new ResolveApi(generatedApiClientConfig)
  const resolve = resolveApi.resolve.bind(resolveApi)
  const chats = new ChatsApi(
    new Configuration({
      fetchApi: fetch,
      basePath: '',
      middleware
    }),
    services.audiusWalletClient,
    services.discoveryNodeSelector,
    services.logger
  )
  const grants = new GrantsApi(
    generatedApiClientConfig,
    services.entityManager,
    users
  )

  const developerApps = new DeveloperAppsApi(
    generatedApiClientConfig,
    services.entityManager
  )

  const dashboardWalletUsers = new DashboardWalletUsersApi(
    generatedApiClientConfig,
    services.entityManager
  )

  const challenges = new ChallengesApi(
    generatedApiClientConfig,
    users,
    services.discoveryNodeSelector,
    services.rewardManagerClient,
    services.claimableTokensClient,
    services.antiAbuseOracle,
    services.logger,
    services.solanaClient
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
    transactions: new TransactionsApiFull(generatedApiClientConfigFull),
    notifications: new NotificationsApiFull(generatedApiClientConfigFull)
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
    services,
    comments
  }
}

export type AudiusSdk = ReturnType<typeof sdk>
