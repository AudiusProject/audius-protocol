import {
  AudiusSdk,
  sdk,
  getDefaultDiscoveryNodeSelectorConfig,
  developmentConfig,
  stagingConfig,
  productionConfig,
  DiscoveryNodeSelector
} from '@audius/sdk'
import { readConfig, Environment } from './config'

const makeDiscoveryNodeSelector = (
  environment: Environment,
  allowlist?: string[]
) => {
  const config =
    environment === 'production'
      ? productionConfig
      : environment === 'staging'
        ? stagingConfig
        : developmentConfig
  return new DiscoveryNodeSelector({
    ...getDefaultDiscoveryNodeSelectorConfig(config),
    allowlist: allowlist ? new Set(allowlist) : undefined
  })
}

let audiusSdk: AudiusSdk | undefined = undefined

export const getAudiusSdk = () => {
  if (audiusSdk === undefined) {
    const config = readConfig()
    // TODO: CN selector with allowlist?
    audiusSdk = sdk({
      appName: 'audius-client',
      environment: config.environment,
      services: {
        discoveryNodeSelector: makeDiscoveryNodeSelector(
          config.environment,
          config.discoveryNodeAllowlist
        )
      }
    })
  }
  return audiusSdk
}
