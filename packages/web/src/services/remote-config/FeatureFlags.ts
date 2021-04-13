/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  ENABLE_USER_REPLICA_SET_MANAGER = 'enable_user_replica_set_manager',
  TRENDING_UNDERGROUND = 'trending_underground'
}

export const flagDefaults: { [key in FeatureFlags]: boolean } = {
  [FeatureFlags.ENABLE_USER_REPLICA_SET_MANAGER]: false,
  [FeatureFlags.TRENDING_UNDERGROUND]: false
}
