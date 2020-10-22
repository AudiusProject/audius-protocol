import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Address, Event } from 'types'

export type State = {
  // Timeline events keyed by wallet
  timelines: { [wallet: string]: Event[] }
}

export const initialState: State = {
  timelines: {}
}

type SetTimeline = {
  wallet: Address
  timeline: Event[]
}

const slice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setTimeline: (state, action: PayloadAction<SetTimeline>) => {
      const { wallet, timeline } = action.payload
      state.timelines[wallet] = timeline
    }
  }
})

export const { setTimeline } = slice.actions

export default slice.reducer
