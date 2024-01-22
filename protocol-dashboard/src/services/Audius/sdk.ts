import {
  DiscoveryNodeSelector,
  EntityManager,
  developmentConfig,
  productionConfig,
  sdk,
  stagingConfig
} from '@audius/sdk'

let audiusSdk = null

const initAudiusSdk = () => {
  const env = import.meta.env.VITE_ENVIRONMENT
  const bootstrapConfig =
    env === 'development'
      ? developmentConfig
      : env === 'staging'
      ? stagingConfig
      : productionConfig
  const {
    discoveryNodes,
    entityManagerContractAddress,
    web3ProviderUrl,
    identityServiceUrl
  } = bootstrapConfig
  const dnSelector = new DiscoveryNodeSelector({
    bootstrapServices: discoveryNodes
    // initialSelectedNode: 'https://discoveryprovider4.staging.audius.co'
  })
  audiusSdk = sdk({
    appName: 'Audius Protocol Dashboard',
    services: {
      discoveryNodeSelector: dnSelector,
      entityManager: new EntityManager({
        contractAddress: entityManagerContractAddress,
        web3ProviderUrl: web3ProviderUrl,
        identityServiceUrl: identityServiceUrl,
        discoveryNodeSelector: dnSelector
      })
    }
  })
}

initAudiusSdk()

export { audiusSdk }
