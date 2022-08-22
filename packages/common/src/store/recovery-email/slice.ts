import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {}

type ResendRecoveryEmailPayload = {}

const slice = createSlice({
  name: 'recovery-email',
  initialState,
  reducers: {
    resendRecoveryEmail: (
      _state,
      _action: PayloadAction<ResendRecoveryEmailPayload>
    ) => {}
  }
})

export const { resendRecoveryEmail } = slice.actions

export default slice.reducer
export const actions = slice.actions
