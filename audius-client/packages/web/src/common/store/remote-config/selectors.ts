import { CommonState } from 'common/store'

export const isRemoteConfigLoaded = (state: CommonState) =>
  state.remoteConfig.remoteConfigLoaded
