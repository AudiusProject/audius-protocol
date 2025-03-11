import { developmentConfig } from '@audius/sdk/src/config/development'
import { productionConfig } from '@audius/sdk/src/config/production'
import { stagingConfig } from '@audius/sdk/src/config/staging'

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

export const getDiscoveryNode = () =>
  discoveryNodes[Math.floor(Math.random() * discoveryNodes.length)]
