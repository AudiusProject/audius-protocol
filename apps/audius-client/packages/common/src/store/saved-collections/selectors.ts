import { createSelector } from '@reduxjs/toolkit'

import { getUsers } from 'store/cache/users/selectors'

import { AccountCollection } from '../account'
import { getAccountStatus } from '../account/selectors'
import { getCollections } from '../cache/collections/selectors'
import { CommonState } from '../commonStore'

import { CollectionWithOwner } from './types'

const getAccountCollections = (state: CommonState) => state.account.collections
export const getSavedAlbumsState = (state: CommonState) =>
  state.savedCollections.albums
export const getSavedPlaylistsState = (state: CommonState) =>
  state.savedCollections.playlists

export const getAccountAlbums = createSelector(
  [getAccountCollections, getAccountStatus],
  (collections, status) => ({
    status,
    data: Object.values(collections).filter((c) => c.is_album)
  })
)

type GetAlbumsWithDetailsResult = {
  fetched: CollectionWithOwner[]
  unfetched: AccountCollection[]
}
/** Returns a mapped list of albums for which we have fetched full details */
export const getFetchedAlbumsWithDetails = createSelector(
  [getAccountAlbums, getCollections, getUsers],
  (albums, collections, users) => {
    // TODO: Might want to read status, what happens for failed loads of parts of the collection?
    return albums.data.reduce<GetAlbumsWithDetailsResult>(
      (acc, cur) => {
        const collectionMetadata = collections[cur.id]
        if (collectionMetadata) {
          const ownerHandle =
            users[collectionMetadata.playlist_owner_id]?.handle ?? ''
          acc.fetched.push({ ...collections[cur.id], ownerHandle })
        } else {
          acc.unfetched.push(cur)
        }
        return acc
      },
      { fetched: [], unfetched: [] }
    )
  }
)

export const getAccountPlaylists = createSelector(
  [getAccountCollections, getAccountStatus],
  (collections, status) => ({
    status,
    data: Object.values(collections).filter((c) => !c.is_album)
  })
)
