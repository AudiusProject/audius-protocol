import { getUser } from '~/store/cache/users/selectors'

import { CommonState } from '../commonStore'

export const getIsAccountComplete = (state: CommonState) => {
  const { userId } = state.account

  const user = getUser(state, { id: userId })
  if (!user) return false

  const { handle, name } = user
  return Boolean(handle && name)
}

export const getGuestEmail = (state: CommonState) => {
  return state.account.guestEmail ?? null
}

export const getUserId = (state: CommonState) => state.account.userId
export const getAccountStatus = (state: CommonState) => state.account.status

export const getWalletAddresses = (state: CommonState) =>
  state.account.walletAddresses
