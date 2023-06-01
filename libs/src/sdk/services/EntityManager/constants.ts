import type { EntityManagerConfig } from './types'
import { productionConfig } from '../../config'

export const defaultEntityManagerConfig: EntityManagerConfig = {
  contractAddress: productionConfig.entityManagerContractAddress,
  web3ProviderUrl: productionConfig.web3ProviderUrl,
  identityServiceUrl: productionConfig.identityServiceEndpoint
}

export const DEFAULT_GAS_LIMIT = 2000000
