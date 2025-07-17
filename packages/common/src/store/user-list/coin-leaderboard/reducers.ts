import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { CoinLeaderboardPageState } from './types'

type CoinLeaderboardActions = ActionType<typeof actions>

const initialState: CoinLeaderboardPageState = {
  mint: null
}

const coinLeaderboardReducer = createReducer<
  CoinLeaderboardPageState,
  CoinLeaderboardActions
>(initialState, {
  [actions.SET_COIN_LEADERBOARD](state, action) {
    return {
      ...state,
      mint: action.mint
    }
  }
})

export default coinLeaderboardReducer
