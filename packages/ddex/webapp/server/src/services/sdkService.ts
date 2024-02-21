import type { AudiusSdk, ServicesConfig } from '@audius/sdk'
import {
  AppAuth,
  DiscoveryNodeSelector,
  EntityManager,
  Logger,
  StorageNodeSelector,
  developmentConfig,
  stagingConfig,
  productionConfig,
  sdk,
} from '@audius/sdk'

const createSdkService = (): AudiusSdk => {
  const ddexKey = process.env.DDEX_KEY
  const ddexSecret = process.env.DDEX_SECRET
  const env = process.env.NODE_ENV || 'development'
  if (!ddexKey || !ddexSecret) {
    throw new Error('DDEX keys not configured. Unable to initialize SDK')
  }

  try {
    const logger = new Logger({ logLevel: 'info' })

    // Determine config to use
    let config = developmentConfig as ServicesConfig
    let initialSelectedNode = 'http://audius-protocol-discovery-provider-1'
    if (env === 'prod') {
      config = productionConfig as ServicesConfig
      initialSelectedNode = 'https://discoveryprovider.audius.co'
    } else if (env === 'stage') {
      config = stagingConfig as ServicesConfig
      initialSelectedNode = 'https://discoveryprovider.staging.audius.co'
    }

    // Init SDK
    const discoveryNodeSelector = new DiscoveryNodeSelector({
      initialSelectedNode,
    })
    const storageNodeSelector = new StorageNodeSelector({
      auth: new AppAuth(ddexKey, ddexSecret),
      discoveryNodeSelector: discoveryNodeSelector,
      bootstrapNodes: config.storageNodes,
      logger,
    })
    const sdkInstance = sdk({
      services: {
        discoveryNodeSelector,
        entityManager: new EntityManager({
          discoveryNodeSelector,
          web3ProviderUrl: config.web3ProviderUrl,
          contractAddress: config.entityManagerContractAddress,
          identityServiceUrl: config.identityServiceUrl,
          useDiscoveryRelay: true,
          logger,
        }),
        storageNodeSelector,
        logger,
      },
      apiKey: ddexKey,
      apiSecret: ddexSecret,
      appName: 'DDEX Demo',
    })
    console.log(`SDK initialized for ${env}`)
    return sdkInstance
  } catch (error) {
    throw new Error(`SDK failed to initialize for ${env}: ${error}`)
  }
}

export default createSdkService
