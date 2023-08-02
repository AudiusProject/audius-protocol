import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

export type CreateChatModalState = {
  presetMessage?: string
  onCancelAction?: Action
}

const initialState: CreateChatModalState = {}

const slice = createSlice({
  name: 'application/ui/createChatModal',
  initialState,
  reducers: {
    setState: (
      state,
      action: PayloadAction<{ presetMessage?: string; onCancelAction?: Action }>
    ) => {
      state.presetMessage = action.payload.presetMessage
      state.onCancelAction = action.payload.onCancelAction
    }
  }
})

export const actions = slice.actions

export default slice.reducer
