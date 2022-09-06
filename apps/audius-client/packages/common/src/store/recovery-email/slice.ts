import { createSlice } from '@reduxjs/toolkit'

import { Status } from '../../models'

export type RecoveryEmailState = {
  status: Status
}

const initialState: RecoveryEmailState = {
  status: Status.IDLE
}

const slice = createSlice({
  name: 'recovery-email',
  initialState,
  reducers: {
    resendRecoveryEmail: (state) => {
      state.status = Status.LOADING
    },
    resendSuccess: (state) => {
      state.status = Status.SUCCESS
    },
    resendError: (state) => {
      state.status = Status.ERROR
    }
  }
})

export const { resendRecoveryEmail, resendSuccess, resendError } = slice.actions

export default slice.reducer
export const actions = slice.actions
