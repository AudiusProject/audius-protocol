module.exports.DISCOVERY_PROVIDER_TIMESTAMP = '@audius/libs:discovery-node-timestamp'
module.exports.DISCOVERY_SERVICE_NAME = 'discovery-node'
module.exports.UNHEALTHY_BLOCK_DIFF = 30
module.exports.REGRESSED_MODE_TIMEOUT = 2 * 60 * 1000 // two minutes

// When to time out the cached discovery provider
module.exports.DISCOVERY_PROVIDER_RESELECT_TIMEOUT = 10 /* min */ * 60 /* seconds */ * 1000 /* millisec */
// How often to make sure the cached discovery provider is fresh
module.exports.DISCOVERY_PROVIDER_TIMESTAMP_INTERVAL = 5000

module.exports.REQUEST_TIMEOUT_MS = 30 /* seconds */ * 1000 /* millisec */
