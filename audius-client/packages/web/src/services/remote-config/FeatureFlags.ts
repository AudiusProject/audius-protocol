/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  ENABLE_BLACK_LIVES_MATTER_EXPLORE_TILE = 'enable_black_lives_matter_explore_tile'
}

export const flagDefaults: { [key in FeatureFlags]: boolean } = {
  [FeatureFlags.ENABLE_BLACK_LIVES_MATTER_EXPLORE_TILE]: false
}
