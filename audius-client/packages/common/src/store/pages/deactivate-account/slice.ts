import { createSlice } from '@reduxjs/toolkit'

import { Status } from '../../../models'

export type DeactivateAccountState = {
  status?: Status
}

const initialState: DeactivateAccountState = {
  status: Status.IDLE
}

const slice = createSlice({
  name: 'application/pages/deactivateAccount',
  initialState,
  reducers: {
    deactivateAccount: (state) => {
      state.status = Status.LOADING
    },
    afterDeactivationSignOut: (state) => {
      state.status = Status.SUCCESS
    },
    deactivateAccountFailed: (state) => {
      state.status = Status.ERROR
    }
  }
})

export const {
  deactivateAccount,
  afterDeactivationSignOut,
  deactivateAccountFailed
} = slice.actions

export const actions = slice.actions

export default slice.reducer
