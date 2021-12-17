import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  remoteConfigLoaded: false
}

const slice = createSlice({
  name: 'remoteConfig',
  initialState,
  reducers: {
    setDidLoad(state) {
      state.remoteConfigLoaded = true
    }
  }
})

export const { setDidLoad } = slice.actions

export default slice.reducer

export type RemoteConfigState = typeof initialState
export type StateWithRemoteConfig = { remoteConfig: RemoteConfigState }
