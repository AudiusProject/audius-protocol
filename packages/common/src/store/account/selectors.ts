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
export const getUserHandle = createSelector([internalGetAccountUser], (user) =>
  user ? user.handle : null
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
          collections[collection.id] &&
          !collections[collection.id]?._marked_deleted &&
          !collections[collection.id]?.is_delete &&
          collection.user.id in users &&
          !users[collection.user.id].is_deactivated
            ? {
                ...collections[collection.id],
                ownerHandle: collection.user.handle,
                ownerName: users[collection.user.id].name
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
      (p) => !collections[p.id] || !collections[p.id]._marked_deleted
    )
  }
)

export const getAccountCollections = createSelector(
  [internalGetAccountCollections, getCollections],
  (accountCollections, collections) => {
    return Object.keys(accountCollections).reduce(
      (acc, cur) => {
        const track = accountCollections[cur as unknown as number]
        if (!collections[track.id] || collections[track.id]._marked_deleted)
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

export const getAccountWithPlaylists = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      playlists: account.collections.filter((c) => !c.is_album)
    }
  }
)

export const getAccountWithOwnPlaylists = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      playlists: account.collections.filter(
        (c) => account && !c.is_album && account.user_id === c.playlist_owner_id
      )
    }
  }
)

export const getAccountWithAlbums = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      albums: account.collections.filter((c) => c.is_album)
    }
  }
)

export const getAccountOwnAlbums = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return account.collections.filter(
      (c) => c.is_album && account.user_id === c.playlist_owner_id
    )
  }
)

export const getAccountWithNameSortedPlaylistsAndAlbums = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    const nameSortedCollections = account.collections.sort((a, b) =>
      a.playlist_name.toLowerCase().localeCompare(b.playlist_name.toLowerCase())
    )
    return {
      ...account,
      playlists: nameSortedCollections.filter((c) => !c.is_album),
      albums: nameSortedCollections.filter((c) => c.is_album)
    }
  }
)

export const getAccountWithSavedPlaylistsAndAlbums = createSelector(
  [getUserHandle, getAccountWithCollections],
  (handle, account) => {
    if (!account) return undefined
    return {
      ...account,
      playlists: account.collections.filter(
        (c) => !c.is_album && c.ownerHandle !== handle
      ),
      albums: account.collections.filter(
        (c) => c.is_album && c.ownerHandle !== handle
      )
    }
  }
)

export const getAccountOwnedPlaylists = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections.filter((c) => !c.is_album && c.user.id === userId)
)

export const getAccountAlbumIds = createSelector(
  [getUserPlaylists],
  (collections) => collections.filter((c) => c.is_album).map(({ id }) => id)
)

export const getAccountSavedPlaylistIds = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections
      .filter((c) => !c.is_album && c.user.id !== userId)
      .map(({ id }) => id)
)

export const getAccountOwnedPlaylistIds = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections
      .filter((c) => !c.is_album && c.user.id === userId)
      .map(({ id }) => id)
)
