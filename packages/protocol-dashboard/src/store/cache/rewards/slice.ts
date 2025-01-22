import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

import { Status, Address } from 'types'

export type State = {
  users: {
    [wallet: string]:
      | {
          status: Status.Loading | Status.Failure
        }
      | {
          status: Status.Success
          reward: BN
          delegateToUserRewards: { [key: string]: BN }
        }
  }
}

export const initialState: State = {
  users: {}
}

type FetchWeeklyRewards = { wallet: Address }
type SetWeeklyRewards = {
  wallet: Address
  reward: BN
  delegateToUserRewards: { [key: string]: BN }
}

const slice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    fetchWeeklyRewards: (state, action: PayloadAction<FetchWeeklyRewards>) => {
      state.users[action.payload.wallet] = {
        status: Status.Loading
      }
    },
    setWeeklyRewards: (state, action: PayloadAction<SetWeeklyRewards>) => {
      state.users[action.payload.wallet] = {
        status: Status.Success,
        reward: action.payload.reward,
        delegateToUserRewards: action.payload.delegateToUserRewards
      }
    }
  }
})

export const { fetchWeeklyRewards, setWeeklyRewards } = slice.actions

export default slice.reducer
