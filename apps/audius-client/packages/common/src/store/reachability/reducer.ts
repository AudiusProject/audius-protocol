import { ActionType, createReducer } from 'typesafe-actions'

import * as actions from './actions'
import { ReachabilityState } from './types'

type ReachabilityActions = ActionType<typeof actions>

const initialState: ReachabilityState = {
  // Default to truthy 'unconfirmed' state to differentiate
  // between optimistic reachability and confirmed reachability
  networkReachable: 'unconfirmed'
}

const reducer = createReducer<ReachabilityState, ReachabilityActions>(
  initialState,
  {
    [actions.SET_REACHABLE](state: ReachabilityState) {
      return { ...state, networkReachable: true }
    },
    [actions.SET_UNREACHABLE](state: ReachabilityState) {
      return { ...state, networkReachable: false }
    }
  }
)

export default reducer
