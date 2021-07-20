import { AppState } from 'store/types'

export const isRemoteConfigLoaded = (state: AppState) =>
  state.remoteConfig.remoteConfigLoaded
