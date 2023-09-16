import type { EntityManagerConfigInternal } from './types'
import { productionConfig } from '../../config'
import { Logger } from '../Logger'

export const defaultEntityManagerConfig: EntityManagerConfigInternal = {
  contractAddress: productionConfig.entityManagerContractAddress,
  web3ProviderUrl: productionConfig.web3ProviderUrl,
  identityServiceUrl: productionConfig.identityServiceUrl,
  useDiscoveryRelay: false,
  logger: new Logger()
}

export const DEFAULT_GAS_LIMIT = 2000000
export const CONFIRMATION_POLLING_INTERVAL = 2000
export const CONFIRMATION_TIMEOUT = 45000
