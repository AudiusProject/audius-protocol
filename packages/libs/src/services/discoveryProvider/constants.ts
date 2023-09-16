export const DISCOVERY_PROVIDER_TIMESTAMP =
  '@audius/libs:discovery-node-timestamp'
export const DISCOVERY_SERVICE_NAME = 'discovery-node'
export const DEFAULT_UNHEALTHY_BLOCK_DIFF = 15
export const REGRESSED_MODE_TIMEOUT = 2 * 60 * 1000 // two minutes

// When to time out the cached discovery provider
export const DISCOVERY_PROVIDER_RESELECT_TIMEOUT =
  10 /* min */ * 60 /* seconds */ * 1000 /* millisec */
// How often to make sure the cached discovery provider is fresh
export const DISCOVERY_PROVIDER_TIMESTAMP_INTERVAL = 5000

export const REQUEST_TIMEOUT_MS = 30 /* seconds */ * 1000 /* millisec */
