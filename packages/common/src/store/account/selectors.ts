import { createSelector } from 'reselect'

import { AccountCollection } from '~/models/Collection'
import { getCollections } from '~/store/cache/collections/selectors'
import { getUser, getUsers } from '~/store/cache/users/selectors'
import { removeNullable } from '~/utils/typeUtils'

import { CommonState } from '../commonStore'

const internalGetAccountCollections = (state: CommonState) =>
  state.account.collections
const internalGetUserPlaylists = (state: CommonState) =>
  Object.values(state.account.collections)
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
 * Gets user playlists with playlists marked delete removed.
 */
export const getUserPlaylists = createSelector(
  [internalGetUserPlaylists, getCollections],
  (playlists, collections) => {
    // Strange filter:
    // If we haven't cached the collection (e.g. on first load), always return it.
    // If we have cached it and it's marked delete, don't return it bc we know better now.
    return playlists.filter(
      (p) => !collections[p.id] || !collections[p.id]?.metadata?._marked_deleted
    )
  }
)

export const getAccountCollections = createSelector(
  [internalGetAccountCollections, getCollections],
  (accountCollections, collections) => {
    return Object.keys(accountCollections).reduce(
      (acc, cur) => {
        const track = accountCollections[cur as unknown as number]
        if (
          !collections[track.id] ||
          collections[track.id]?.metadata?._marked_deleted
        )
          return acc
        return {
          ...acc,
          [track.id]: track
        }
      },
      {} as { [id: number]: AccountCollection }
    )
  }
)
