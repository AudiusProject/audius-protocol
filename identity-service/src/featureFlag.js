const uuidv4 = require('uuid/v4')

// Declaration of feature flags set in optimizely
const FEATURE_FLAGS = Object.freeze({
  SOLANA_LISTEN_ENABLED_SERVER: 'solana_listen_enabled_server'
})

// Default values for feature flags while optimizely has not loaded
// Generally, these should be never seen unless variables are
// consumed within a few seconds of server init
const DEFAULTS = Object.freeze({
  [FEATURE_FLAGS.SOLANA_LISTEN_ENABLED_SERVER]: false
})

/**
 * Fetches a feature flag
 * @param {OptimizelyClient?} optimizelyClient
 * @param {String} flag FEATURE_FLAGS value
 * @param {String} userId the user id to determine whether this feature is
 * enabled. By default this is just random, so every call to getFeatureFlag
 * will have the same behavior.
 * @returns
 */
const getFeatureFlag = (optimizelyClient, flag, userId = uuidv4()) => {
  if (!optimizelyClient) {
    return DEFAULTS[flag]
  }
  return optimizelyClient.isFeatureEnabled(
    flag, userId
  )
}

module.exports = {
  getFeatureFlag,
  FEATURE_FLAGS
}
