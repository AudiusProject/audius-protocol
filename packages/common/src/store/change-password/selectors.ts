import { createSelector } from '@reduxjs/toolkit'

import { CommonState } from '~/store/commonStore'

const changePasswordState = (state: CommonState) => state.ui.changePassword

export const getConfirmCredentialsStatus = createSelector(
  changePasswordState,
  (state) => state.confirmCredentials.status
)

export const getChangePasswordStatus = createSelector(
  changePasswordState,
  (state) => state.changePassword.status
)

export const getCurrentPage = createSelector(
  changePasswordState,
  (state) => state.currentPage
)
