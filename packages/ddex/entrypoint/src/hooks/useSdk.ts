import { DiscoveryNodeSelector, productionConfig, sdk, stagingConfig } from '@audius/sdk'

const env = import.meta.env.VITE_ENVIRONMENT as 'dev' | 'stage' | 'prod'

const config = env === 'prod' ? productionConfig : stagingConfig
const discoveryNodeSelector = new DiscoveryNodeSelector({
  bootstrapServices: config.discoveryNodes,
})

const instance = sdk({
  appName: 'ddex',
  services: {
    discoveryNodeSelector
  }
})

export const useSdk = () => ({ sdk: instance })
