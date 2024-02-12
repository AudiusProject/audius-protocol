import type { Nullable } from '@audius/common/utils'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type ShareToStoryPlatform = 'instagram' | 'snapchat' | 'tiktok'
type State = {
  progress: number
  cancel: Nullable<() => Promise<void>>
  platform: Nullable<ShareToStoryPlatform>
}

const initialState: State = {
  progress: 0,
  cancel: null,
  platform: null
}

export type ShareToStoryProgressState = State

const slice = createSlice({
  name: 'shareToStoryProgress',
  initialState,
  reducers: {
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload
    },
    setCancel: (state, action: PayloadAction<() => Promise<void>>) => {
      state.cancel = action.payload
    },
    setPlatform: (state, action: PayloadAction<ShareToStoryPlatform>) => {
      state.platform = action.payload
    },
    reset: (state) => {
      state.progress = 0
      state.cancel = initialState.cancel
      state.platform = null
    }
  }
})

export const { setProgress, setPlatform, setCancel, reset } = slice.actions

export default slice.reducer
