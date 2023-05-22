import { createSelector } from '@reduxjs/toolkit'

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

export const getAccountAlbums = createSelector(
  [getAccountCollections, getAccountStatus],
  (collections, status) => ({
    status,
    data: Object.values(collections).filter((c) => c.is_album)
  })
)

export const getAccountPlaylists = createSelector(
  [getAccountCollections, getAccountStatus],
  (collections, status) => ({
    status,
    data: Object.values(collections).filter((c) => !c.is_album)
  })
)
