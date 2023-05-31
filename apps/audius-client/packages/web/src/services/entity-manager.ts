import {
  EntityManager,
  developmentConfig,
  productionConfig,
  stagingConfig
} from '@audius/sdk'

import { env } from './env'

const servicesConfig =
  env.ENVIRONMENT === 'development'
    ? developmentConfig
    : env.ENVIRONMENT === 'staging'
    ? stagingConfig
    : productionConfig

export const entityManagerInstance = new EntityManager({
  contractAddress: servicesConfig.entityManagerContractAddress,
  web3ProviderUrl: servicesConfig.web3ProviderUrl,
  identityServiceUrl: servicesConfig.identityServiceEndpoint
})
