import {
  EntityManager,
  developmentConfig,
  productionConfig,
  stagingConfig,
  DiscoveryNodeSelectorService
} from '@audius/sdk'

import { env } from './env'

const servicesConfig =
  env.ENVIRONMENT === 'development'
    ? developmentConfig
    : env.ENVIRONMENT === 'staging'
    ? stagingConfig
    : productionConfig

export const makeEntityManagerInstance = (
  discoveryNodeSelector: DiscoveryNodeSelectorService
) => {
  return new EntityManager({
    contractAddress: servicesConfig.entityManagerContractAddress,
    web3ProviderUrl: servicesConfig.web3ProviderUrl,
    identityServiceUrl: servicesConfig.identityServiceUrl,
    discoveryNodeSelector
  })
}
