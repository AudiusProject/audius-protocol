import { createSlice } from '@reduxjs/toolkit'

import { ShareModalState, RequestOpenAction, OpenAction } from './types'

const initialState: ShareModalState = {
  source: null,
  content: null
}

const slice = createSlice({
  name: 'applications/ui/shareModal',
  initialState,
  reducers: {
    requestOpen: (state, action: RequestOpenAction) => {},
    open: (state, action: OpenAction) => {
      const { source, ...content } = action.payload
      state.content = content
      state.source = source
    }
  }
})

export const { requestOpen, open } = slice.actions

export default slice.reducer
