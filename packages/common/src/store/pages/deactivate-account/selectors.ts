import { CommonState } from '../../commonStore'

export const getDeactivateAccountStatus = (state: CommonState) =>
  state.pages.deactivateAccount.status
