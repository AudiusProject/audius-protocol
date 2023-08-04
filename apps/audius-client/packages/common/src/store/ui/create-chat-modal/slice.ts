import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'

export type CreateChatModalState = {
  presetMessage?: string
  onCancelAction?: Action
}

const initialState: CreateChatModalState = {}

// This is only really relevant on Web, where we don't have the ability to route the URL to the modal
// On mobile, the ChatUserListScreen is a screen and we can pass the presetMessage in as a param,
// and navigation is handled nicely, no need for a cancel action.
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
