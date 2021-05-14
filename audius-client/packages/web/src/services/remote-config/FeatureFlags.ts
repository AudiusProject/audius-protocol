/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  TRENDING_UNDERGROUND = 'trending_underground',
  SOLANA_LISTEN_ENABLED = 'solana_listen_enabled',
  USE_TRACK_CONTENT_POLLING = 'use_track_content_polling',
  USE_RESUMABLE_TRACK_UPLOAD = 'use_resumable_track_upload'
}

export const flagDefaults: { [key in FeatureFlags]: boolean } = {
  [FeatureFlags.TRENDING_UNDERGROUND]: false,
  [FeatureFlags.USE_TRACK_CONTENT_POLLING]: true,
  [FeatureFlags.SOLANA_LISTEN_ENABLED]: false,
  [FeatureFlags.USE_RESUMABLE_TRACK_UPLOAD]: true
}
