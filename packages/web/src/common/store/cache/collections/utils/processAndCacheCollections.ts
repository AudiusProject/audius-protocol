import {
  cacheActions,
  reformatCollection,
  getContext
} from '@audius/common/store'
import {} from '@audius/common'
import {
  Kind,
  CollectionMetadata,
  UserCollectionMetadata,
  ID
} from '@audius/common/models'
import { makeUid } from '@audius/common/utils'
import { put, call } from 'redux-saga/effects'

import { addTracksFromCollections } from './addTracksFromCollections'
import { addUsersFromCollections } from './addUsersFromCollections'
import { retrieveTracksForCollections } from './retrieveCollections'

function isUserCollections(
  collections: CollectionMetadata[] | UserCollectionMetadata[]
): collections is UserCollectionMetadata[] {
  const [collection] = collections
  return collection && 'user' in collection
}

/**
 * Processes and caches a collection
 * @param collections collections to cache
 * @param shouldRetrieveTracks whether or not to retrieve the tracks inside the collection (we don't need
 *  to do this for displaying collection cards)
 * @param excludedTrackIds optional track ids to exclude from retrieve
 */
export function* processAndCacheCollections(
  collections: CollectionMetadata[] | UserCollectionMetadata[],
  shouldRetrieveTracks = true,
  excludedTrackIds: ID[] = []
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  if (isUserCollections(collections)) {
    yield addUsersFromCollections(collections)
  }
  yield addTracksFromCollections(collections)

  let reformattedCollections = collections.map((c) =>
    reformatCollection({ collection: c, audiusBackendInstance })
  )

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
