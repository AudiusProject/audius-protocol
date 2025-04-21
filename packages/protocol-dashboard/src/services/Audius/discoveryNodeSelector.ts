import {
  DiscoveryNodeSelector,
  getDefaultDiscoveryNodeSelectorConfig,
  developmentConfig,
  stagingConfig,
  productionConfig
} from '@audius/sdk'

const discoveryEndpoint = import.meta.env.VITE_DISCOVERY_ENDPOINT
const env = import.meta.env.VITE_ENVIRONMENT

export let discoveryNodeSelector: DiscoveryNodeSelector | undefined

// Initialize the discovery node selector if the discovery endpoint is set
if (discoveryEndpoint) {
  const servicesConfig =
    env === 'development'
      ? developmentConfig
      : env === 'staging'
        ? stagingConfig
        : productionConfig

  discoveryNodeSelector = new DiscoveryNodeSelector({
    ...getDefaultDiscoveryNodeSelectorConfig(servicesConfig),
    initialSelectedNode: discoveryEndpoint,
    allowlist: new Set([discoveryEndpoint])
  })
}
