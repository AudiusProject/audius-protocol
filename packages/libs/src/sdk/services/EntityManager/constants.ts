import {
  developmentConfig,
  productionConfig,
  stagingConfig
} from '../../config'
import { Env } from '../../types/Env'
import { Logger } from '../Logger'

import type { EntityManagerConfigInternal } from './types'

export const defaultEntityManagerConfig: Record<
  Env,
  EntityManagerConfigInternal
> = {
  production: {
    contractAddress: productionConfig.entityManagerContractAddress,
    web3ProviderUrl: productionConfig.web3ProviderUrl,
    identityServiceUrl: productionConfig.identityServiceUrl,
    useDiscoveryRelay: true,
    logger: new Logger()
  },
  staging: {
    contractAddress: stagingConfig.entityManagerContractAddress,
    web3ProviderUrl: stagingConfig.web3ProviderUrl,
    identityServiceUrl: stagingConfig.identityServiceUrl,
    useDiscoveryRelay: true,
    logger: new Logger({ logLevel: 'debug' })
  },
  development: {
    contractAddress: developmentConfig.entityManagerContractAddress,
    web3ProviderUrl: developmentConfig.web3ProviderUrl,
    identityServiceUrl: developmentConfig.identityServiceUrl,
    useDiscoveryRelay: true,
    logger: new Logger({ logLevel: 'debug' })
  }
}

export const DEFAULT_GAS_LIMIT = 2000000
export const CONFIRMATION_POLLING_INTERVAL = 2000
export const CONFIRMATION_TIMEOUT = 45000
