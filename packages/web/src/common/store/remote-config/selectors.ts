type StateWithRemoteConfig = { remoteConfig: { remoteConfigLoaded: boolean } }

export const isRemoteConfigLoaded = (state: StateWithRemoteConfig) =>
  state.remoteConfig.remoteConfigLoaded
