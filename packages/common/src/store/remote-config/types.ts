export const remoteConfigInitialState = {
  remoteConfigLoaded: false
}

export type RemoteConfigState = typeof remoteConfigInitialState
export type StateWithRemoteConfig = { remoteConfig: RemoteConfigState }
