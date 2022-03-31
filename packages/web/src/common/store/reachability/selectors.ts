import { CommonState } from 'common/store'

export const getIsReachable = (state: CommonState) =>
  state.reachability.networkReachable
