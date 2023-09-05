import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from '../../models/Status'

import { ChangePasswordPageStep, ChangePasswordState } from './types'

const initialState: ChangePasswordState = {
  confirmCredentials: {
    status: undefined
  },
  changePassword: {
    status: undefined
  },
  currentPage: ChangePasswordPageStep.CONFIRM_CREDENTIALS
}

const slice = createSlice({
  name: 'change-password',
  initialState,
  reducers: {
    confirmCredentials: (
      state,
      _action: PayloadAction<{ email: string; password: string }>
    ) => {
      state.confirmCredentials.status = Status.LOADING
    },
    confirmCredentialsSucceeded: (state) => {
      state.confirmCredentials.status = Status.SUCCESS
    },
    confirmCredentialsFailed: (state) => {
      state.confirmCredentials.status = Status.ERROR
    },
    changePassword: (
      state,
      _action: PayloadAction<{
        email: string
        password: string
        oldPassword: string
      }>
    ) => {
      state.changePassword.status = Status.LOADING
    },
    changePasswordSucceeded: (state) => {
      state.changePassword.status = Status.SUCCESS
    },
    changePasswordFailed: (state) => {
      state.changePassword.status = Status.ERROR
    },
    changePage: (state, action: PayloadAction<ChangePasswordPageStep>) => {
      state.currentPage = action.payload
    }
  }
})

export const {
  confirmCredentials,
  confirmCredentialsSucceeded,
  confirmCredentialsFailed,
  changePassword,
  changePasswordSucceeded,
  changePasswordFailed,
  changePage
} = slice.actions

export default slice.reducer
export const actions = slice.actions
