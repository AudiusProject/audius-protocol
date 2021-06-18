const REMOTE_CONFIG_FEATURE = 'remote_config'

// Declaration of remote config variables set in optimizely
const VARS = {
  TRENDING_EXPERIMENT: 'TRENDING_EXPERIMENT'
}

// Use a dummy user id since remote config is enabled by default
// for all users
const DUMMY_USER_ID = 'ANONYMOUS_USER'

const getRemoteVar = (optimizelyClient, variable) => {
  return optimizelyClient.getFeatureVariable(
    REMOTE_CONFIG_FEATURE, variable, DUMMY_USER_ID
  )
}

module.exports = {
  getRemoteVar,
  VARS
}
