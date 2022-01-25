/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  TRENDING_UNDERGROUND = 'trending_underground',
  SOLANA_LISTEN_ENABLED = 'solana_listen_enabled',
  PLAYLIST_UPDATES_ENABLED = 'playlist_updates_enabled',
  CREATE_WAUDIO_USER_BANK_ON_SIGN_UP = 'create_waudio_user_bank_on_sign_up',
  SHARE_SOUND_TO_TIKTOK = 'share_sound_to_tiktok',
  REMIXABLES = 'remixables',
  REMIXABLES_WEB = 'remixables_web',
  TRANSFER_AUDIO_TO_WAUDIO_ON_LOAD = 'transfer_audio_to_waudio_on_load',
  CHALLENGE_REWARDS_UI = 'challenge_rewards_ui',
  NFT_IMAGE_PICKER_TAB = 'nft_image_picker_tab',
  SOL_WALLET_AUDIO_ENABLED = 'sol_wallet_audio_enabled',
  SOLANA_COLLECTIBLES_ENABLED = 'solana_collectibles_enabled',
  ARTIST_RECOMMENDATIONS_ENABLED = 'artist_recommendations_enabled',
  SURFACE_AUDIO_ENABLED = 'surface_audio_enabled',
  PREFER_HIGHER_PATCH_FOR_PRIMARY = 'prefer_higher_patch_for_primary',
  PREFER_HIGHER_PATCH_FOR_SECONDARIES = 'prefer_higher_patch_for_secondaries',
  REWARDS_NOTIFICATIONS_ENABLED = 'rewards_notifications_enabled',
  ENABLE_SPL_AUDIO = 'enable_spl_audio'
}

/**
 * If optimizely errors, these default values are used.
 */
export const flagDefaults: { [key in FeatureFlags]: boolean } = {
  [FeatureFlags.TRENDING_UNDERGROUND]: false,
  [FeatureFlags.SOLANA_LISTEN_ENABLED]: false,
  [FeatureFlags.PLAYLIST_UPDATES_ENABLED]: false,
  [FeatureFlags.CREATE_WAUDIO_USER_BANK_ON_SIGN_UP]: false,
  [FeatureFlags.SHARE_SOUND_TO_TIKTOK]: false,
  [FeatureFlags.REMIXABLES]: false,
  [FeatureFlags.REMIXABLES_WEB]: false,
  [FeatureFlags.TRANSFER_AUDIO_TO_WAUDIO_ON_LOAD]: false,
  [FeatureFlags.CHALLENGE_REWARDS_UI]: false,
  [FeatureFlags.NFT_IMAGE_PICKER_TAB]: false,
  [FeatureFlags.SOL_WALLET_AUDIO_ENABLED]: false,
  [FeatureFlags.SOLANA_COLLECTIBLES_ENABLED]: false,
  [FeatureFlags.ARTIST_RECOMMENDATIONS_ENABLED]: false,
  [FeatureFlags.SURFACE_AUDIO_ENABLED]: false,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_PRIMARY]: true,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_SECONDARIES]: true,
  [FeatureFlags.REWARDS_NOTIFICATIONS_ENABLED]: false,
  [FeatureFlags.ENABLE_SPL_AUDIO]: false
}

export enum FeatureFlagCohortType {
  /**
   * Segments feature experiments by a user's id. If userId is not present,
   * the feature is off.
   */
  USER_ID = 'user_id',
  /**
   * Segments feature experiments by a random uuid set in local storage defined by FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY.
   * There should always be a value for sessionId. This is managed in Provider.ts
   */
  SESSION_ID = 'session_id'
}

export const flagCohortType: {
  [key in FeatureFlags]: FeatureFlagCohortType
} = {
  [FeatureFlags.SOLANA_LISTEN_ENABLED]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.SOLANA_COLLECTIBLES_ENABLED]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.TRENDING_UNDERGROUND]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.PLAYLIST_UPDATES_ENABLED]: FeatureFlagCohortType.USER_ID,
  // Create wAudio user bank on sign up is a session id experiment because it only impacts
  // unauthenticated sessions during sign up
  [FeatureFlags.CREATE_WAUDIO_USER_BANK_ON_SIGN_UP]:
    FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.SHARE_SOUND_TO_TIKTOK]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.REMIXABLES]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.REMIXABLES_WEB]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.TRANSFER_AUDIO_TO_WAUDIO_ON_LOAD]:
    FeatureFlagCohortType.USER_ID,
  [FeatureFlags.CHALLENGE_REWARDS_UI]: FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.NFT_IMAGE_PICKER_TAB]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.SOL_WALLET_AUDIO_ENABLED]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.ARTIST_RECOMMENDATIONS_ENABLED]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.SURFACE_AUDIO_ENABLED]: FeatureFlagCohortType.USER_ID,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_PRIMARY]:
    FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_SECONDARIES]:
    FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.REWARDS_NOTIFICATIONS_ENABLED]:
    FeatureFlagCohortType.SESSION_ID,
  [FeatureFlags.ENABLE_SPL_AUDIO]: FeatureFlagCohortType.SESSION_ID
}
