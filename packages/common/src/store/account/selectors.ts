import { CommonState } from '../commonStore'

// TODO: how does this fit with tq mindset
export const getAccountStatus = (state: CommonState) => state.account.status

// TODO: how do I put this in the slice?
export const getWalletAddresses = (state: CommonState) =>
  state.account.walletAddresses
