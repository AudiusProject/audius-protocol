import {
  DiscoveryProvider,
  DiscoveryProviderConfig
} from '../services/discoveryProvider'
import { EthContracts, EthContractsConfig } from '../services/ethContracts'
import { EthWeb3Config, EthWeb3Manager } from '../services/ethWeb3Manager'
import { IdentityService } from '../services/identity'
import { UserStateManager } from '../userStateManager'
import { Oauth } from './oauth'

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

  const oauth =
    typeof window !== 'undefined'
      ? new Oauth({ discoveryProvider: discoveryNode, appName })
      : undefined

  return {
    oauth,
    discoveryNode
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
