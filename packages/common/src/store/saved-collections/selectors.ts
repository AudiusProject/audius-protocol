import { createSelector } from '@reduxjs/toolkit'

import { ID } from '~/models/Identifiers'
import { getUsers } from '~/store/cache/users/selectors'

import { getAccountStatus } from '../account/selectors'
import { getCollections } from '../cache/collections/selectors'
import { CommonState } from '../commonStore'

import { CollectionType } from './types'

const getAccountCollections = (state: CommonState) => state.account.collections

export const getSavedCollectionsState = (
  state: CommonState,
  type: CollectionType
) =>
  type === 'albums'
    ? state.savedCollections.albums
    : state.savedCollections.playlists

export const getFetchedCollectionIds = createSelector(
  [getCollections],
  (collections) => Object.values(collections).map((c) => c.playlist_id)
)

/** Returns a Set of collection IDs which should be treated as visible (aren't
 * deleted or owned by a deactivated user) */
export const getVisibleCollectionIds = createSelector(
  [getCollections, getUsers],
  (collections, users) => {
    return Object.values(collections).reduce((accum, collection) => {
      const owner = users[collection.playlist_owner_id]
      const shouldHideCollection =
        collection._marked_deleted ||
        collection.is_delete ||
        (owner && owner.is_deactivated)

      if (!shouldHideCollection) {
        accum.add(collection.playlist_id)
      }

      return accum
    }, new Set<ID>())
  }
)

/** Returns a list of albums saved to the current account */
export const getAccountAlbums = createSelector(
  [getAccountCollections, getAccountStatus],
  (collections, status) => ({
    status,
    data: Object.values(collections).filter((c) => c.is_album)
  })
)

/** Returns a list of playlists saved to the current account */
export const getAccountPlaylists = createSelector(
  [getAccountCollections, getAccountStatus],
  (collections, status) => ({
    status,
    data: Object.values(collections).filter((c) => !c.is_album)
  })
)
