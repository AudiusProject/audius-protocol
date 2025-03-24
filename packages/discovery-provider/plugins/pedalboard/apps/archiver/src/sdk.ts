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

const environmentToSdkEnvironment: Record<
  Environment,
  'development' | 'staging' | 'production'
> = {
  dev: 'development',
  stage: 'staging',
  prod: 'production'
}

const makeDiscoveryNodeSelector = (
  environment: Environment,
  allowlist?: string[]
) => {
  const config =
    environment === 'prod'
      ? productionConfig
      : environment === 'stage'
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
    audiusSdk = sdk({
      appName: 'audius-client',
      environment: environmentToSdkEnvironment[config.environment],
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
