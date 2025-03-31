const uuidv4 = require('uuid/v4')

// Declaration of feature flags set in optimizely
const FEATURE_FLAGS = Object.freeze({
  DETECT_ABUSE_ON_RELAY: 'detect_abuse_on_relay',
  BLOCK_ABUSE_ON_RELAY: 'block_abuse_on_relay'
})

// Default values for feature flags while optimizely has not loaded
// Generally, these should be never seen unless variables are
// consumed within a few seconds of server init
const DEFAULTS = Object.freeze({
  [FEATURE_FLAGS.DETECT_ABUSE_ON_RELAY]: false,
  [FEATURE_FLAGS.BLOCK_ABUSE_ON_RELAY]: false
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
  return optimizelyClient.isFeatureEnabled(flag, userId)
}

module.exports = {
  getFeatureFlag,
  FEATURE_FLAGS
}
