import {
  sdk,
  DiscoveryNodeSelector,
  productionConfig,
  stagingConfig,
  developmentConfig
} from '@audius/sdk'

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
}

const discoveryNodeSelector = new DiscoveryNodeSelector({
  bootstrapServices: (
    sdkConfigs[process.env.VITE_ENVIRONMENT as keyof typeof sdkConfigs] ??
    productionConfig
  ).discoveryNodes
})

export const audiusSdk = sdk({
  appName: process.env.VITE_PUBLIC_HOSTNAME ?? 'audius.co',
  services: {
    discoveryNodeSelector
  }
})
