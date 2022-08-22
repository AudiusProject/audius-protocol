import { createSlice } from '@reduxjs/toolkit'

import {
  ShareModalState,
  ShareModalRequestOpenAction,
  ShareModalOpenAction
} from './types'

const initialState: ShareModalState = {
  source: null,
  content: null
}

const slice = createSlice({
  name: 'applications/ui/shareModal',
  initialState,
  reducers: {
    requestOpen: (_state, _action: ShareModalRequestOpenAction) => {},
    open: (state, action: ShareModalOpenAction) => {
      const { source, ...content } = action.payload
      state.content = content
      state.source = source
    }
  }
})

export const { requestOpen, open } = slice.actions

export default slice.reducer
export const actions = slice.actions
