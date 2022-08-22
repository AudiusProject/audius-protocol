import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
  ShareSoundToTiktokModalOpenPayload,
  ShareSoundToTiktokModalRequestOpenPayload,
  ShareSoundToTiktokModalSetStatusPayload,
  ShareSoundToTiktokModalAuthenticatedPayload,
  ShareSoundToTikTokModalState,
  ShareSoundToTiktokModalStatus
} from './types'

const initialState: ShareSoundToTikTokModalState = {
  isAuthenticated: false,
  status: ShareSoundToTiktokModalStatus.SHARE_UNINITIALIZED
}

// Slice

const slice = createSlice({
  name: 'application/ui/shareSoundToTikTokModal',
  initialState,
  reducers: {
    authenticated: (
      state,
      action: PayloadAction<ShareSoundToTiktokModalAuthenticatedPayload>
    ) => {
      state.openId = action.payload.openId
      state.accessToken = action.payload.accessToken
    },
    open: (
      state,
      action: PayloadAction<ShareSoundToTiktokModalOpenPayload>
    ) => {
      const { track } = action.payload
      state.isAuthenticated = false
      state.track = track
      state.status = ShareSoundToTiktokModalStatus.SHARE_UNINITIALIZED
    },
    requestOpen: (
      _state,
      _action: PayloadAction<ShareSoundToTiktokModalRequestOpenPayload>
    ) => {},
    setIsAuthenticated: (state) => {
      state.isAuthenticated = true
    },
    setStatus: (
      state,
      action: PayloadAction<ShareSoundToTiktokModalSetStatusPayload>
    ) => {
      const { status } = action.payload
      state.status = status
    },
    share: () => {},
    upload: () => {}
  }
})

export const {
  authenticated,
  open,
  requestOpen,
  setIsAuthenticated,
  setStatus,
  share,
  upload
} = slice.actions
export const actions = slice.actions
export default slice.reducer
