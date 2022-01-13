import { AppState } from 'store/types'

export const getDeactivateAccountStatus = (state: AppState) =>
  state.application.ui.deactivateAccount.status
