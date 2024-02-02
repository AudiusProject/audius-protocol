import { CommonState } from '~/store/commonStore'

export const getIsReachable = (state: CommonState) =>
  state.reachability.networkReachable
