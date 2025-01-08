import {
  sdk,
  DiscoveryNodeSelector,
  productionConfig,
  stagingConfig,
  developmentConfig
} from '@audius/sdk'

import { env } from 'services/env'

import { discoveryNodeAllowlist } from './constants'

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
}

let discoveryNodes = (
  sdkConfigs[process.env.VITE_ENVIRONMENT as keyof typeof sdkConfigs] ??
  productionConfig
).network.discoveryNodes

if (discoveryNodeAllowlist.length > 0) {
  discoveryNodes = discoveryNodes.filter((d) =>
    discoveryNodeAllowlist.includes(d.endpoint)
  )
}

const discoveryNodeSelector = new DiscoveryNodeSelector({
  bootstrapServices: discoveryNodes
})

export const audiusSdk = sdk({
  appName: env.APP_NAME,
  services: {
    discoveryNodeSelector
  }
})
