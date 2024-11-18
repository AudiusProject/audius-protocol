const uuidv4 = require('uuid/v4')

// Declaration of feature flags set in optimizely
const FEATURE_FLAGS = Object.freeze({
  SOLANA_SEND_RAW_TRANSACTION: 'solana_send_raw_transaction',
  REWARDS_ATTESTATION_ENABLED: 'rewards_attestation_enabled',
  REWARDS_NOTIFICATIONS_ENABLED: 'rewards_notifications_enabled',
  SOCIAL_PROOF_TO_SEND_AUDIO_ENABLED: 'social_proof_to_send_audio_enabled',
  DETECT_ABUSE_ON_RELAY: 'detect_abuse_on_relay',
  BLOCK_ABUSE_ON_RELAY: 'block_abuse_on_relay',
  SUPPORTER_DETHRONED_PUSH_NOTIFS_ENABLED:
    'supporter_dethroned_push_notifs_enabled',
  READ_SUBSCRIBERS_FROM_DISCOVERY_ENABLED:
    'read_subscribers_from_discovery_enabled',
  USDC_PURCHASES: 'usdc_purchases'
})

// Default values for feature flags while optimizely has not loaded
// Generally, these should be never seen unless variables are
// consumed within a few seconds of server init
const DEFAULTS = Object.freeze({
  [FEATURE_FLAGS.SOLANA_SEND_RAW_TRANSACTION]: false,
  [FEATURE_FLAGS.REWARDS_ATTESTATION_ENABLED]: false,
  [FEATURE_FLAGS.REWARDS_NOTIFICATIONS_ENABLED]: false,
  [FEATURE_FLAGS.SOCIAL_PROOF_TO_SEND_AUDIO_ENABLED]: true,
  [FEATURE_FLAGS.DETECT_ABUSE_ON_RELAY]: false,
  [FEATURE_FLAGS.BLOCK_ABUSE_ON_RELAY]: false,
  [FEATURE_FLAGS.SUPPORTER_DETHRONED_PUSH_NOTIFS_ENABLED]: false,
  [FEATURE_FLAGS.READ_SUBSCRIBERS_FROM_DISCOVERY_ENABLED]: false,
  [FEATURE_FLAGS.USDC_PURCHASES]: false
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
