import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {}

const slice = createSlice({
  name: 'ui/coinflow-modal',
  initialState,
  reducers: {
    transactionSucceeded: (_state, _action: PayloadAction<{}>) => {
      // Handled by saga
    },
    transactionFailed: (_state, _action: PayloadAction<{ error: Error }>) => {
      // Handled by saga
    },
    transactionCanceled: (_state, _action: PayloadAction<{}>) => {
      // Handled by saga
    }
  }
})

export const { transactionSucceeded, transactionFailed, transactionCanceled } =
  slice.actions

export default slice.reducer
export const actions = slice.actions
