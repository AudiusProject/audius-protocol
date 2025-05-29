import { createSelector } from '@reduxjs/toolkit'

import { getAccountStatus } from '../account/selectors'
import { CommonState } from '../commonStore'

const getAccountCollections = (state: CommonState) => state.account.collections

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
