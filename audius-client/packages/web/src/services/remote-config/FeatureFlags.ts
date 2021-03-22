/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  ENABLE_BLACK_LIVES_MATTER_EXPLORE_TILE = 'enable_black_lives_matter_explore_tile',
  ENABLE_USER_REPLICA_SET_MANAGER = 'enable_user_replica_set_manager'
}

export const flagDefaults: { [key in FeatureFlags]: boolean } = {
  [FeatureFlags.ENABLE_BLACK_LIVES_MATTER_EXPLORE_TILE]: false,
  [FeatureFlags.ENABLE_USER_REPLICA_SET_MANAGER]: false
}
