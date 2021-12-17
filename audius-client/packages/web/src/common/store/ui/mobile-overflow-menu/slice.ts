import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { OpenPayload, OverflowSource, MobileOverflowModalState } from './types'

const initialState: MobileOverflowModalState = {
  isOpen: false,
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
      const {
        id,
        source,
        overflowActions,
        overflowActionCallbacks
      } = action.payload
      state.isOpen = true
      state.id = id
      state.source = source
      state.overflowActions = overflowActions
      state.overflowActionCallbacks = overflowActionCallbacks ?? {}
    },
    close: state => {
      // We don't clear out the actions because
      // it causes an empty drawer while it is animating out
      state.isOpen = false
    }
  }
})

export const { open, close } = slice.actions

export default slice.reducer
