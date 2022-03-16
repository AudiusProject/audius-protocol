import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {}

type ResendRecoveryEmailPayload = {}

const slice = createSlice({
  name: 'recovery-email',
  initialState,
  reducers: {
    resendRecoveryEmail: (
      state,
      action: PayloadAction<ResendRecoveryEmailPayload>
    ) => {}
  }
})

export const { resendRecoveryEmail } = slice.actions

export default slice.reducer
