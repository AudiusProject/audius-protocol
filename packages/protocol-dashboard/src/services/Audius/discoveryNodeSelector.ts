import {
  DiscoveryNodeSelector,
  getDefaultDiscoveryNodeSelectorConfig,
  developmentConfig,
  stagingConfig,
  productionConfig
} from '@audius/sdk'

const env = import.meta.env.VITE_ENVIRONMENT

export const discoveryNodeAllowlist =
  env === 'production' ? new Set([]) : undefined

// Initialize a DN selector with allow list to be shared by SDK/libs
const servicesConfig =
  env === 'development'
    ? developmentConfig
    : env === 'staging'
      ? stagingConfig
      : productionConfig

export const discoveryNodeSelector = new DiscoveryNodeSelector({
  ...getDefaultDiscoveryNodeSelectorConfig(servicesConfig),
  allowlist: discoveryNodeAllowlist
})
