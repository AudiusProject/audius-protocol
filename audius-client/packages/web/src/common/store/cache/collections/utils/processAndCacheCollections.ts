import { ID } from '@audius/common'
import { put, call } from 'redux-saga/effects'

import { UserCollectionMetadata } from 'common/models/Collection'
import Kind from 'common/models/Kind'
import * as cacheActions from 'common/store/cache/actions'
import { makeUid } from 'common/utils/uid'

import { addTracksFromCollections } from './addTracksFromCollections'
import { addUsersFromCollections } from './addUsersFromCollections'
import { reformat } from './reformat'
import { retrieveTracksForCollections } from './retrieveCollections'

/**
 * Processes and caches a collection
 * @param {Collection} collections collections to cache
 * @param {boolean} shouldRetrieveTracks whether or not to retrieve the tracks inside the collection (we don't need
 *  to do this for displaying collection cards)
 * @param {Array<ID>} excludedTrackIds optional track ids to exclude from retrieve
 */
export function* processAndCacheCollections(
  collections: UserCollectionMetadata[],
  shouldRetrieveTracks = true,
  excludedTrackIds: ID[] = []
) {
  yield addUsersFromCollections(collections)
  yield addTracksFromCollections(collections)

  let reformattedCollections = collections.map((c) => reformat(c))

  if (shouldRetrieveTracks) {
    // Retrieve the tracks
    const excludedSet = new Set(excludedTrackIds)
    reformattedCollections = yield call(
      retrieveTracksForCollections,
      reformattedCollections,
      excludedSet
    )
  }

  yield put(
    cacheActions.add(
      Kind.COLLECTIONS,
      reformattedCollections.map((c) => ({
        id: c.playlist_id,
        uid: makeUid(Kind.COLLECTIONS, c.playlist_id),
        metadata: c
      })),
      false,
      true
    )
  )

  return reformattedCollections
}
