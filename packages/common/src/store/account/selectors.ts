import { getUser } from '~/store/cache/users/selectors'

import { CommonState } from '../commonStore'

export const getIsAccountComplete = (state: CommonState) => {
  const { userId } = state.account

  const user = getUser(state, { id: userId })
  if (!user) return false

  const { handle, name } = user
  return Boolean(handle && name)
}

export const getUserId = (state: CommonState) => state.account.userId
// TODO: how does this fit with tq mindset
export const getAccountStatus = (state: CommonState) => state.account.status

// TODO: how do I put this in the slice?
export const getWalletAddresses = (state: CommonState) =>
  state.account.walletAddresses
