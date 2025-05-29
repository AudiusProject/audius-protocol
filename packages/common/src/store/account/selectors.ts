import { CommonState } from '../commonStore'

// TODO: how does this fit with tq mindset
export const getAccountStatus = (state: CommonState) => state.account.status

export const getWalletAddresses = (state: CommonState) =>
  state.account.walletAddresses
