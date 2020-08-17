import * as actions from './actions'
import { ActionType, createReducer } from 'typesafe-actions'
import { ReachabilityState } from './types'

type ReachabilityActions = ActionType<typeof actions>

const initialState = {
  networkReachable: true
}

const reducer = createReducer<ReachabilityState, ReachabilityActions>(
  initialState,
  {
    [actions.SET_REACHABLE]() {
      return { networkReachable: true }
    },
    [actions.SET_UNREACHABLE]() {
      return { networkReachable: false }
    }
  }
)

export default reducer
