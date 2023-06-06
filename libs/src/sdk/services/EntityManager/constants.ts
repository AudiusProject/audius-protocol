import type { EntityManagerConfig } from './types'
import { productionConfig } from '../../config'
import { DiscoveryNodeSelector } from '../DiscoveryNodeSelector'

export const defaultEntityManagerConfig: EntityManagerConfig = {
  contractAddress: productionConfig.entityManagerContractAddress,
  web3ProviderUrl: productionConfig.web3ProviderUrl,
  identityServiceUrl: productionConfig.identityServiceUrl,
  discoveryNodeSelector: new DiscoveryNodeSelector()
}

export const DEFAULT_GAS_LIMIT = 2000000
