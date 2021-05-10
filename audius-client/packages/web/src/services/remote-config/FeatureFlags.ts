/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  SOLANA_LISTEN_ENABLED = 'solana_listen_enabled'
}

export const flagDefaults: { [key in FeatureFlags]: boolean } = {
  [FeatureFlags.SOLANA_LISTEN_ENABLED]: false
}
