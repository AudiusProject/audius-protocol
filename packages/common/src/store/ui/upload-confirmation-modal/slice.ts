import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { UploadConfirmationState } from './types'

export type OpenPayload = PayloadAction<{
  hasPublicTracks: boolean
  confirmCallback: () => void
}>

const initialState: UploadConfirmationState = {
  hasPublicTracks: true,
  confirmCallback: () => {}
}

const slice = createSlice({
  name: 'applications/ui/uploadConfirmation',
  initialState,
  reducers: {
    requestOpen: (_state, _action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      const { confirmCallback, hasPublicTracks } = action.payload
      state.hasPublicTracks = hasPublicTracks
      state.confirmCallback = confirmCallback
    }
  }
})

export const { open, requestOpen } = slice.actions
export const actions = slice.actions
export default slice.reducer
