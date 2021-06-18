const REMOTE_CONFIG_FEATURE = 'remote_config'

// Declaration of remote config variables set in optimizely
const REMOTE_VARS = Object.freeze({
  TRENDING_EXPERIMENT: 'TRENDING_EXPERIMENT'
})

// Default values for remote vars while optimizely has not loaded
// Generally, these should be never seen unless variables are
// consumed within a few seconds of server init
const DEFAULTS = Object.freeze({
  [REMOTE_VARS.TRENDING_EXPERIMENT]: null
})

// Use a dummy user id since remote config is enabled by default
// for all users
const DUMMY_USER_ID = 'ANONYMOUS_USER'

/**
 * Fetches a remote variable
 * @param {OptimizelyClient?} optimizelyClient
 * @param {String} variable REMOTE_VARS value
 * @returns
 */
const getRemoteVar = (optimizelyClient, variable) => {
  if (!optimizelyClient) {
    return DEFAULTS[variable]
  }
  return optimizelyClient.getFeatureVariable(
    REMOTE_CONFIG_FEATURE, variable, DUMMY_USER_ID
  )
}

module.exports = {
  getRemoteVar,
  REMOTE_VARS
}
