module.exports.DISCOVERY_PROVIDER_TIMESTAMP = '@audius/libs:discovery-provider-timestamp'
module.exports.UNHEALTHY_BLOCK_DIFF = 15

// When to time out the cached discovery provider
module.exports.DISCOVERY_PROVIDER_RESELECT_TIMEOUT = 1 /* min */ * 60 /* seconds */ * 1000 /* millisec */
// How often to make sure the cached discovery provider is fresh
module.exports.DISCOVERY_PROVIDER_TIMESTAMP_INTERVAL = 5000

module.exports.REQUEST_TIMEOUT_MS = 30 /* seconds */ * 1000 /* millisec */
