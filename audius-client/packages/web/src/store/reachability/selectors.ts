import { AppState } from 'store/types'

export const getIsReachable = (state: AppState) =>
  state.reachability.networkReachable
