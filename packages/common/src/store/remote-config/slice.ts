import { createSlice } from '@reduxjs/toolkit'

import { remoteConfigInitialState } from './types'

const slice = createSlice({
  name: 'remoteConfig',
  initialState: remoteConfigInitialState,
  reducers: {
    setDidLoad(state) {
      state.remoteConfigLoaded = true
    }
  }
})

export const { setDidLoad } = slice.actions
export const actions = slice.actions
export default slice.reducer
