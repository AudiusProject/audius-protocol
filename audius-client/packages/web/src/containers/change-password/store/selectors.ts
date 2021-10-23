import { createSelector } from '@reduxjs/toolkit'

import { AppState } from 'store/types'

const changePasswordState = (state: AppState) =>
  state.application.ui.changePassword

export const getConfirmCredentialsStatus = createSelector(
  changePasswordState,
  state => state.confirmCredentials.status
)

export const getChangePasswordStatus = createSelector(
  changePasswordState,
  state => state.changePassword.status
)

export const getCurrentPage = createSelector(
  changePasswordState,
  state => state.currentPage
)
