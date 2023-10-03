const { logger } = require('./logging')

const REMOTE_CONFIG_FEATURE = 'remote_config'

const DISCOVERY_NOTIFICATION_MAPPING = 'discovery_notification_mapping'
const MappingVariable = {
  PushRepost: 'push_repost',
  PushSave: 'push_save',
  PushRemix: 'push_remix',
  PushCosign: 'push_cosign',
  PushAddTrackToPlaylist: 'push_add_track_to_playlist',
  PushFollow: 'push_follow',
  PushMilestone: 'push_milestone',
  PushMilestoneFollowerCount: 'push_milestone_follower_count',
  PushSupporterRankUp: 'push_supporter_rank_up',
  PushSupportingRankUp: 'push_supporting_rank_up',
  PushSupporterDethroned: 'push_supporter_dethroned',
  PushTipReceive: 'push_tip_receive',
  PushTipSend: 'push_tip_send',
  PushChallengeReward: 'push_challenge_reward',
  PushTrackAddedToPlaylist: 'push_track_added_to_playlist',
  PushCreate: 'push_create',
  PushTrending: 'push_trending',
  PushAnnouncement: 'push_announcement',
  PushReaction: 'push_reaction'
}

const NOTIFICATIONS_EMAIL_PLUGIN = 'notification_email_plugin'
const EmailPluginMappings = {
  Live: 'live',
  Scheduled: 'scheduled'
}

// Declaration of remote config variables set in optimizely
const REMOTE_VARS = Object.freeze({
  TRENDING_EXPERIMENT: 'TRENDING_EXPERIMENT',
  CHALLENGE_IDS_DENY_LIST: 'CHALLENGE_IDS_DENY_LIST',
  REWARDS_ATTESTATION_ENDPOINTS: 'REWARDS_ATTESTATION_ENDPOINTS',
  ORACLE_ENDPOINT: 'ORACLE_ENDPOINT',
  ORACLE_ETH_ADDRESS: 'ORACLE_ETH_ADDRESS',
  ATTESTER_DELAY_SEC: 'ATTESTER_DELAY_SEC',
  ATTESTER_PARALLELIZATION: 'ATTESTER_PARALLELIZATION'
})

// Default values for remote vars while optimizely has not loaded
// Generally, these should be never seen unless variables are
// consumed within a few seconds of server init
const DEFAULTS = Object.freeze({
  [REMOTE_VARS.TRENDING_EXPERIMENT]: null,
  [REMOTE_VARS.CHALLENGE_IDS_DENY_LIST]: [],
  [REMOTE_VARS.ATTESTER_DELAY_SEC]: 60,
  [REMOTE_VARS.ATTESTER_PARALLELIZATION]: 2
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
    REMOTE_CONFIG_FEATURE,
    variable,
    DUMMY_USER_ID
  )
}

/**
 * Fetches a remote feature variable
 * @param {OptimizelyClient?} optimizelyClient
 * @param {String} variable REMOTE_FEATURE value
 * @param {String} variable REMOTE_VARS value
 * @returns
 */
const getRemoteFeatureVarEnabled = (optimizelyClient, feature, variable) => {
  if (!optimizelyClient) {
    return DEFAULTS[variable]
  }
  return optimizelyClient.getFeatureVariableBoolean(
    feature,
    variable,
    DUMMY_USER_ID
  )
}

module.exports = {
  getRemoteVar,
  REMOTE_VARS,
  getRemoteFeatureVarEnabled,
  DISCOVERY_NOTIFICATION_MAPPING,
  MappingVariable,
  NOTIFICATIONS_EMAIL_PLUGIN,
  EmailPluginMappings
}
