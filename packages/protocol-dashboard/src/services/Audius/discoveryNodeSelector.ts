import {
  DiscoveryNodeSelector,
  getDefaultDiscoveryNodeSelectorConfig,
  developmentConfig,
  stagingConfig,
  productionConfig
} from '@audius/sdk'

const env = import.meta.env.VITE_ENVIRONMENT

export const discoveryNodeAllowlist =
  env === 'production'
    ? new Set([
        'https://discoveryprovider.audius.co',
        'https://discoveryprovider2.audius.co',
        'https://discoveryprovider3.audius.co',
        'https://audius-dn1.tikilabs.com',
        'https://dn1.monophonic.digital'
      ])
    : undefined

export let discoveryNodeSelector: DiscoveryNodeSelector | undefined

// Initialize a DN selector with allow list to be shared by SDK/libs
const servicesConfig =
  env === 'development'
    ? developmentConfig
    : env === 'staging'
      ? stagingConfig
      : productionConfig

discoveryNodeSelector = new DiscoveryNodeSelector({
  ...getDefaultDiscoveryNodeSelectorConfig(servicesConfig),
  allowlist: discoveryNodeAllowlist
})
