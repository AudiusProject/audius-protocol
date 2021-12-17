export const isRemoteConfigLoaded = <
  State extends { remoteConfig: { remoteConfigLoaded: boolean } }
>(
  state: State
) => state.remoteConfig.remoteConfigLoaded
