import { CommonState } from '../commonStore'

export const getRecoveryEmailStatus = (state: CommonState) =>
  state.ui.recoveryEmail.status
