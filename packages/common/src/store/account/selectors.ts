import { createSelector } from 'reselect'

import { AccountCollection } from '~/models/Collection'
import { getCollections } from '~/store/cache/collections/selectors'
import { getUser, getUsers } from '~/store/cache/users/selectors'
import { removeNullable } from '~/utils/typeUtils'

import { CommonState } from '../commonStore'

const internalGetUserPlaylists = (state: CommonState) =>
  Object.values(state.account.collections)
export const internalGetAccountUser = (state: CommonState) =>
  getUser(state, { id: getUserId(state) })
const hasTracksInternal = (state: CommonState) => state.account.hasTracks

export const getAccount = (state: CommonState) => state.account
export const getHasAccount = (state: CommonState) => !!state.account.userId
export const getIsAccountComplete = (state: CommonState) => {
  const { userId } = state.account

  const user = getUser(state, { id: userId })
  if (!user) return false

  const { handle, name } = user
  return Boolean(handle && name)
}

export const getTrackSaveCount = (state: CommonState) =>
  state.account.trackSaveCount ?? 0

export const getGuestEmail = (state: CommonState) => {
  return state.account.guestEmail ?? null
}

export const getIsGuestAccount = (state: CommonState) => {
  const { userId } = state.account

  const user = getUser(state, { id: userId })
  if (!user) return false

  const { handle, name } = user
  return Boolean(!handle && !name)
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

export const getUserName = createSelector([internalGetAccountUser], (user) =>
  user ? user.name : null
)
export const getAccountVerified = createSelector(
  [internalGetAccountUser],
  (user) => (user ? user.is_verified : false)
)
export const getAccountHasTracks = createSelector(
  [hasTracksInternal, internalGetAccountUser],
  (hasTracks, user) =>
    hasTracks === null
      ? null // still loading
      : hasTracks || (user ? user.track_count > 0 : false)
)
export const getAccountFolloweeCount = createSelector(
  [internalGetAccountUser],
  (user) => user?.followee_count ?? null
)
export const getAccountCollectibles = createSelector(
  [internalGetAccountUser],
  (user) => [
    ...(user?.collectibleList ?? []),
    ...(user?.solanaCollectibleList ?? [])
  ]
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
 * Gets the account and full playlist metadatas.
 * TODO: Add handle directly to playlist metadata so we don't need to join against users.
 */
export const getAccountWithCollections = createSelector(
  [getAccountUser, internalGetUserPlaylists, getCollections, getUsers],
  (account, userPlaylists, collections, users) => {
    if (!account) return undefined
    return {
      ...account,
      collections: [...userPlaylists]
        .map((collection) =>
          collections[collection.id]?.metadata &&
          !collections[collection.id]?.metadata?._marked_deleted &&
          !collections[collection.id]?.metadata?.is_delete &&
          collection.user.id in users &&
          !users[collection.user.id].metadata.is_deactivated
            ? {
                ...collections[collection.id].metadata,
                ownerHandle: collection.user.handle,
                ownerName: users[collection.user.id].metadata.name
              }
            : null
        )
        .filter(removeNullable)
    }
  }
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
