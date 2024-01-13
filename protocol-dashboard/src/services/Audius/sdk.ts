import {
  DiscoveryNodeSelector,
  EntityManager,
  developmentConfig,
  productionConfig,
  sdk,
  stagingConfig
} from '@audius/sdk'

let instance = null
let isReady = false
let sdkResolve = null
const sdkPromise = new Promise(resolve => {
  sdkResolve = resolve
})

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
    initialSelectedNode: 'https://discoveryprovider4.staging.audius.co'
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
  sdkResolve()
  isReady = true
}

const audiusSdk = async () => {
  if (!isReady) {
    await sdkPromise
  }
  return instance
}

export { audiusSdk, initAudiusSdk, isReady }
