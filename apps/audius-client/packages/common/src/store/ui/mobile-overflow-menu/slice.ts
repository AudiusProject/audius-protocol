import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
  OpenOverflowMenuPayload,
  OverflowSource,
  MobileOverflowModalState
} from './types'

const initialState: MobileOverflowModalState = {
  id: null,
  contextPlaylistId: null,
  source: OverflowSource.TRACKS,
  overflowActions: [],
  overflowActionCallbacks: {}
}

const slice = createSlice({
  name: 'application/ui/mobileOverflowModal',
  initialState,
  reducers: {
    open: (state, action: PayloadAction<OpenOverflowMenuPayload>) => {
      const {
        id,
        contextPlaylistId,
        source,
        overflowActions,
        overflowActionCallbacks
      } = action.payload

      state.id = id
      state.contextPlaylistId = contextPlaylistId ?? null
      state.source = source
      state.overflowActions = overflowActions
      state.overflowActionCallbacks = overflowActionCallbacks ?? {}
    }
  }
})

export const { open } = slice.actions

export const actions = slice.actions
export default slice.reducer
