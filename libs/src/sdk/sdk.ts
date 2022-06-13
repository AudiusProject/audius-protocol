import {
  DiscoveryProvider,
  DiscoveryProviderConfig
} from '../services/discoveryProvider'
import { EthContracts, EthContractsConfig } from '../services/ethContracts'
import { EthWeb3Config, EthWeb3Manager } from '../services/ethWeb3Manager'
import { IdentityService } from '../services/identity'
import { UserStateManager } from '../userStateManager'
import { Oauth } from './oauth'
import { TracksApi } from './tracks'
import { ResolveApi } from './resolve'
import { Configuration, PlaylistsApi, UsersApi, TipsApi } from './default'
import {
  PlaylistsApi as PlaylistsApiFull,
  ReactionsApi as ReactionsApiFull,
  SearchApi as SearchApiFull,
  TracksApi as TracksApiFull,
  UsersApi as UsersApiFull,
  TipsApi as TipsApiFull
} from './full'

import {
  CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  ETH_OWNER_WALLET,
  ETH_PROVIDER_URLS,
  ETH_REGISTRY_ADDRESS,
  ETH_TOKEN_ADDRESS,
  IDENTITY_SERVICE_ENDPOINT,
  WORMHOLE_ADDRESS
} from './constants'

type Web3Config = {
  providers: string[]
}

type SdkConfig = {
  appName: string
  discoveryNodeConfig?: DiscoveryProviderConfig
  ethContractsConfig?: EthContractsConfig
  ethWeb3Config?: EthWeb3Config
  identityServiceConfig?: IdentityService
  web3Config?: Web3Config
}

/**
 * The Audius SDK
 */
export const sdk = async (config: SdkConfig) => {
  const {
    appName,
    discoveryNodeConfig,
    ethContractsConfig,
    ethWeb3Config,
    identityServiceConfig
  } = config

  /** Initialize services */

  const userStateManager = new UserStateManager()

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

  const discoveryNode = new DiscoveryProvider({
    ethContracts,
    userStateManager,
    ...discoveryNodeConfig
  })

  // TODO: potentially don't await this and have a different method (callback/event) to
  // know when the sdk is initialized
  await discoveryNode.init()

  const generatedApiClientConfig = new Configuration({
    fetchApi: (url: string) => {
      return discoveryNode._makeRequest({
        endpoint: url
      }) as Promise<Response>
    }
  })

  const tracks = new TracksApi(generatedApiClientConfig, discoveryNode)
  const users = new UsersApi(generatedApiClientConfig)
  const playlists = new PlaylistsApi(generatedApiClientConfig)
  const tips = new TipsApi(generatedApiClientConfig)
  const resolve = new ResolveApi(generatedApiClientConfig)

  const full = {
    tracks: new TracksApiFull(generatedApiClientConfig as any),
    users: new UsersApiFull(generatedApiClientConfig as any),
    search: new SearchApiFull(generatedApiClientConfig as any),
    playlists: new PlaylistsApiFull(generatedApiClientConfig as any),
    reactions: new ReactionsApiFull(generatedApiClientConfig as any),
    tips: new TipsApiFull(generatedApiClientConfig as any)
  }

  const oauth =
    typeof window !== 'undefined'
      ? new Oauth({ discoveryProvider: discoveryNode, appName })
      : undefined

  return {
    oauth,
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
