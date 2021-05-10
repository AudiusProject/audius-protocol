/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {}

export const flagDefaults: { [key in FeatureFlags]: boolean } = {}
