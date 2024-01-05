import {
  DiscoveryNodeSelector,
  EntityManager,
  developmentConfig,
  productionConfig,
  sdk,
  stagingConfig
} from '@audius/sdk'

const SDK_LOADED_EVENT_NAME = 'AUDIUS_SDK_LOADED'
let instance = null
let isReady = false

const initAudiusSdk = ({
  signTransaction,
  getAddress
}: {
  signTransaction: (data: any) => Promise<string>
  getAddress: () => Promise<string> | string
}) => {
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
    bootstrapServices: discoveryNodes,
    initialSelectedNode: 'https://discoveryprovider.staging.audius.co'
  })
  instance = sdk({
    appName: 'Audius Protocol Dashboard',
    services: {
      auth: { signTransaction, getAddress },
      discoveryNodeSelector: dnSelector,
      entityManager: new EntityManager({
        contractAddress: entityManagerContractAddress,
        web3ProviderUrl: web3ProviderUrl,
        identityServiceUrl: identityServiceUrl,
        discoveryNodeSelector: dnSelector
      })
    }
  })
  window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT_NAME))
  isReady = true
}

const audiusSdk = async () => {
  if (!isReady) {
    await new Promise(resolve => {
      window.addEventListener(SDK_LOADED_EVENT_NAME, resolve)
    })
  }
  return instance
}

export { audiusSdk, initAudiusSdk, isReady }
