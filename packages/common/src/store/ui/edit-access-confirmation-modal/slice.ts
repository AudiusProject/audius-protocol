import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { EditAccessConfirmationState, EditAccessType } from './types'

export type OpenPayload = PayloadAction<{
  type: EditAccessType
  confirmCallback: () => void
  cancelCallback: () => void
}>

const initialState: EditAccessConfirmationState = {
  type: null,
  confirmCallback: () => {},
  cancelCallback: () => {}
}

const slice = createSlice({
  name: 'applications/ui/editAccessConfirmation',
  initialState,
  reducers: {
    requestOpen: (_state, _action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      const { type, confirmCallback, cancelCallback } = action.payload
      state.type = type
      state.confirmCallback = confirmCallback
      state.cancelCallback = cancelCallback
    }
  }
})

export const { open, requestOpen } = slice.actions
export const actions = slice.actions
export default slice.reducer
