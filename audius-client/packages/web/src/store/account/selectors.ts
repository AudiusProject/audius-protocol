import { createSelector } from 'reselect'

import { ID } from 'models/common/Identifiers'
import { getCollections } from 'store/cache/collections/selectors'
import { getUser, getUsers } from 'store/cache/users/selectors'
import { AppState } from 'store/types'
import { removeNullable } from 'utils/typeUtils'

import { AccountCollection } from './reducer'

const internalGetAccountCollections = (state: AppState) =>
  state.account.collections
const internalGetUserPlaylists = (state: AppState) =>
  Object.values(state.account.collections)
const internalGetAccountUser = (state: AppState) =>
  getUser(state, { id: getUserId(state) })

export const getHasAccount = (state: AppState) => !!state.account.userId
export const getUserId = (state: AppState) => state.account.userId
export const getAccountStatus = (state: AppState) => state.account.status
export const getUserPlaylistOrder = (state: AppState) =>
  state.account.orderedPlaylists
export const getConnectivityFailure = (state: AppState) =>
  state.account.connectivityFailure
export const getNeedsAccountRecovery = (state: AppState) =>
  state.account.needsAccountRecovery
export const getAccountToCache = (state: AppState) => ({
  userId: state.account.userId,
  collections: state.account.collections,
  hasFavoritedItem: state.account.hasFavoritedItem
})

export const getAccountUser = createSelector(
  [internalGetAccountUser],
  user => user
)
export const getUserHandle = createSelector([internalGetAccountUser], user =>
  user ? user.handle : null
)
export const getUserName = createSelector([internalGetAccountUser], user =>
  user ? user.name : null
)
export const getAccountVerified = createSelector(
  [internalGetAccountUser],
  user => (user ? user.is_verified : false)
)
export const getAccountIsCreator = createSelector(
  [internalGetAccountUser],
  user => (user ? user.is_creator : false)
)
export const getAccountProfilePictureSizes = (state: AppState) => {
  const user = internalGetAccountUser(state)
  return user ? user._profile_picture_sizes : null
}
export const getPlaylistLibrary = (state: AppState) => {
  return getAccountUser(state)?.playlist_library ?? null
}

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
        .map(collection =>
          collections[collection.id] &&
          !collections[collection.id]?._marked_deleted &&
          !collections[collection.id]?.is_delete &&
          collection.user.id in users
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
export const getAccountNavigationPlaylists = (state: AppState) => {
  return Object.keys(state.account.collections).reduce((acc, cur) => {
    const collection = state.account.collections[(cur as unknown) as number]
    if (collection.is_album) return acc
    return {
      ...acc,
      [cur]: collection
    }
  }, {} as { [id: number]: AccountCollection })
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
      p => !collections[p.id] || !collections[p.id]._marked_deleted
    )
  }
)

export const getAccountCollections = createSelector(
  [internalGetAccountCollections, getCollections],
  (accountCollections, collections) => {
    return Object.keys(accountCollections).reduce((acc, cur) => {
      const track = accountCollections[(cur as unknown) as number]
      if (!collections[track.id] || collections[track.id]._marked_deleted)
        return acc
      return {
        ...acc,
        [track.id]: track
      }
    }, {} as { [id: number]: AccountCollection })
  }
)

export const getAccountWithPlaylists = createSelector(
  [getAccountWithCollections],
  account => {
    if (!account) return undefined
    return {
      ...account,
      playlists: account.collections.filter(c => !c.is_album)
    }
  }
)

export const getAccountWithOwnPlaylists = createSelector(
  [getAccountWithCollections],
  account => {
    if (!account) return undefined
    return {
      ...account,
      playlists: account.collections.filter(
        c => account && !c.is_album && account.user_id === c.playlist_owner_id
      )
    }
  }
)

export const getAccountWithAlbums = createSelector(
  [getAccountWithCollections],
  account => {
    if (!account) return undefined
    return {
      ...account,
      albums: account.collections.filter(c => c.is_album)
    }
  }
)

export const getAccountWithPlaylistsAndAlbums = createSelector(
  [getAccountWithCollections],
  account => {
    if (!account) return undefined
    return {
      ...account,
      playlists: account.collections.filter(c => !c.is_album),
      albums: account.collections.filter(c => c.is_album)
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
        c => !c.is_album && c.ownerHandle !== handle
      ),
      albums: account.collections.filter(
        c => c.is_album && c.ownerHandle !== handle
      )
    }
  }
)

export const getAccountOwnedPlaylists = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections.filter(c => !c.is_album && c.user.id === userId)
)

export const getAccountAlbumIds = createSelector(
  [getUserPlaylists],
  collections => collections.filter(c => c.is_album).map(({ id }) => id)
)

export const getAccountSavedPlaylistIds = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections
      .filter(c => !c.is_album && c.user.id !== userId)
      .map(({ id }) => id)
)

export const getAccountOwnedPlaylistIds = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections
      .filter(c => !c.is_album && c.user.id === userId)
      .map(({ id }) => id)
)
