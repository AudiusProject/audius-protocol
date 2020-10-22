import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from 'types'

export type State = {
  users: {
    [wallet: string]: {
      status: Status
      hasClaim: boolean
    }
  }
}

export const initialState: State = {
  users: {}
}

type FetchClaim = { wallet: string }
type SetClaim = { wallet: string; hasClaim: boolean }

const slice = createSlice({
  name: 'claim',
  initialState,
  reducers: {
    fetchClaim: (state, action: PayloadAction<FetchClaim>) => {
      state.users[action.payload.wallet] = {
        status: Status.Loading,
        hasClaim: false
      }
    },
    setClaim: (state, action: PayloadAction<SetClaim>) => {
      state.users[action.payload.wallet] = {
        status: Status.Success,
        hasClaim: action.payload.hasClaim
      }
    }
  }
})

export const { fetchClaim, setClaim } = slice.actions

export default slice.reducer
