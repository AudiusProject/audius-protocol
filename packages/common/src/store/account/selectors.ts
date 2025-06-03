import { createSelector } from 'reselect'

import { AccountCollection } from '~/models/Collection'
import { getUser } from '~/store/cache/users/selectors'

import { CommonState } from '../commonStore'

export const internalGetAccountUser = (state: CommonState) =>
  getUser(state, { id: getUserId(state) })

export const getAccount = (state: CommonState) => state.account
export const getHasAccount = (state: CommonState) => !!state.account.userId
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
export const getNeedsAccountRecovery = (state: CommonState) =>
  state.account.needsAccountRecovery

export const getWalletAddresses = (state: CommonState) =>
  state.account.walletAddresses

export const getAccountUser = createSelector(
  [internalGetAccountUser],
  (user) => user
)

export const getPlaylistLibrary = (state: CommonState) => {
  return state.account.playlistLibrary
}
export const getAccountERCWallet = createSelector(
  [internalGetAccountUser],
  (user) => user?.erc_wallet ?? null
)

export const getAccountSplWallet = createSelector(
  [internalGetAccountUser],
  (user) => user?.spl_usdc_payout_wallet ?? null
)

/**
 * Gets the account's playlist nav bar info
 */
export const getAccountNavigationPlaylists = (state: CommonState) => {
  return Object.keys(state.account.collections).reduce(
    (acc, cur) => {
      const collection = state.account.collections[cur as unknown as number]
      if (collection.is_album) return acc
      if (getUser(state, { id: collection.user.id })?.is_deactivated) return acc
      return {
        ...acc,
        [cur]: collection
      }
    },
    {} as { [id: number]: AccountCollection }
  )
}
