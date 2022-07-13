import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { OpenPayload, OverflowSource, MobileOverflowModalState } from './types'

const initialState: MobileOverflowModalState = {
  id: null,
  source: OverflowSource.TRACKS,
  overflowActions: [],
  overflowActionCallbacks: {}
}

const slice = createSlice({
  name: 'application/ui/mobileOverflowModal',
  initialState,
  reducers: {
    open: (state, action: PayloadAction<OpenPayload>) => {
      const { id, source, overflowActions, overflowActionCallbacks } =
        action.payload
      state.id = id
      state.source = source
      state.overflowActions = overflowActions
      state.overflowActionCallbacks = overflowActionCallbacks ?? {}
    }
  }
})

export const { open } = slice.actions

export default slice.reducer
