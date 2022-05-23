import {
  DiscoveryProvider,
  DiscoveryProviderConfig
} from '../services/discoveryProvider'
import { EthContracts, EthContractsConfig } from '../services/ethContracts'
import { EthWeb3Config, EthWeb3Manager } from '../services/ethWeb3Manager'
// import { Hedgehog, HedgehogConfig } from '../services/hedgehog'
import { IdentityService } from '../services/identity'
// import { Web3Manager, Web3ManagerConfig } from '../services/web3Manager'
import { UserStateManager } from '../userStateManager'

import {
  CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  ETH_OWNER_WALLET,
  ETH_PROVIDER_URLS,
  ETH_REGISTRY_ADDRESS,
  ETH_TOKEN_ADDRESS,
  IDENTITY_SERVICE_ENDPOINT,
  // REGISTRY_ADDRESS,
  WORMHOLE_ADDRESS
} from './constants'
import { oauth } from './oauth'

// TODO: move everything out of index file

type Web3Config = {
  providers: string[]
}

type SdkConfig = {
  appName: string
  discoveryNodeConfig?: DiscoveryProviderConfig
  ethContractsConfig?: EthContractsConfig
  ethWeb3Config?: EthWeb3Config
  // hedgehogConfig?: HedgehogConfig
  identityServiceConfig?: IdentityService
  // web3ManagerConfig?: Web3ManagerConfig
  web3Config?: Web3Config
}

/**
 * The Audius SDK
 */
export const sdk = async (config?: SdkConfig) => {
  const {
    // appName,
    discoveryNodeConfig,
    ethContractsConfig,
    ethWeb3Config,
    // hedgehogConfig,
    identityServiceConfig
    // web3Config
  } = config ?? {}
  /** Initialize services */

  const userStateManager = new UserStateManager()

  const identityService = new IdentityService({
    identityServiceEndpoint: IDENTITY_SERVICE_ENDPOINT,
    ...identityServiceConfig
  })

  // const hedgehogService = new Hedgehog({
  //   identityService,
  //   useLocalStorage: true,
  //   ...hedgehogConfig
  // })

  // const hedgehog = hedgehogService.instance

  const ethWeb3Manager = new EthWeb3Manager({
    identityService,
    web3Config: {
      ownerWallet: ETH_OWNER_WALLET,
      ...ethWeb3Config,
      providers: formatProviders(ethWeb3Config?.providers ?? ETH_PROVIDER_URLS)
    }
  })

  // TODO: support external web3
  // const web3Manager = new Web3Manager({
  //   web3Config: {
  //     useExternalWeb3: false,
  //     internalWeb3Config: {
  //       web3ProviderEndpoints: formatProviders(
  //         web3Config?.providers ?? ETH_PROVIDER_URLS
  //       )
  //     }
  //   },
  //   identityService,
  //   hedgehog
  // })
  // await web3Manager.init()
  // identityService.setWeb3Manager(web3Manager)

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

  await discoveryNode.init()

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
