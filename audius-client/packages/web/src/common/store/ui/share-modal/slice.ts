import { createSlice } from '@reduxjs/toolkit'

import { ShareModalState, RequestOpenAction, OpenAction } from './types'

const initialState: ShareModalState = {}

const slice = createSlice({
  name: 'applications/ui/shareModal',
  initialState,
  reducers: {
    requestOpen: (state, action: RequestOpenAction) => {},
    open: (state, action: OpenAction) => {
      const { track, source } = action.payload
      state.track = track
      state.source = source
    }
  }
})

export const { requestOpen, open } = slice.actions

export default slice.reducer
