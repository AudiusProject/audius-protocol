import { createSlice } from '@reduxjs/toolkit'

import { ShareModalState, RequestOpenAction, OpenAction } from './types'

const initialState: ShareModalState = {}

const slice = createSlice({
  name: 'applications/ui/shareModal',
  initialState,
  reducers: {
    requestOpen: (state, action: RequestOpenAction) => {},
    open: (state, action: OpenAction) => {
      const { track } = action.payload
      state.track = track
    }
  }
})

export const { requestOpen, open } = slice.actions

export default slice.reducer
