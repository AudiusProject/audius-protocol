import { createSlice } from '@reduxjs/toolkit'

export type RecoveryEmailState = {
  status: 'idle' | 'pending' | 'resolved' | 'rejected'
}

const initialState: RecoveryEmailState = {
  status: 'idle'
}

const slice = createSlice({
  name: 'recovery-email',
  initialState,
  reducers: {
    resendRecoveryEmail: (state) => {
      state.status = 'pending'
    },
    resendSuccess: (state) => {
      state.status = 'resolved'
    },
    resendError: (state) => {
      state.status = 'rejected'
    }
  }
})

export const { resendRecoveryEmail, resendSuccess, resendError } = slice.actions

export default slice.reducer
export const actions = slice.actions
