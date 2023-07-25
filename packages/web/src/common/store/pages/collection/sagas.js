import {
  Kind,
  makeUid,
  cacheActions,
  collectionPageActions as collectionActions,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors
} from '@audius/common'
import {
  call,
  put,
  select,
  take,
  takeLatest,
  takeEvery
} from 'redux-saga/effects'

import {
  retrieveCollections,
  retrieveCollectionByPermalink
} from 'common/store/cache/collections/utils'

import tracksSagas from './lineups/sagas'
const { getCollectionUid, getUserUid } = collectionPageSelectors
const { fetchCollection, fetchCollectionSucceeded, fetchCollectionFailed } =
  collectionActions

function* watchFetchCollection() {
  yield takeLatest(collectionActions.FETCH_COLLECTION, function* (action) {
    const { id: collectionId, permalink, fetchLineup } = action
    let retrievedCollections
    if (permalink) {
      retrievedCollections = yield call(
        retrieveCollectionByPermalink,
        permalink,
        {
          requiresAllTracks: true,
          deleteExistingEntry: true
        }
      )
    } else {
      retrievedCollections = yield call(retrieveCollections, [collectionId], {
        requiresAllTracks: true,
        deleteExistingEntry: true
      })
    }

    const { collections, uids: collectionUids } = retrievedCollections

    if (Object.values(collections).length === 0) {
      yield put(fetchCollectionFailed())
      return
    }
    const collection = collections[collectionId]
    const userUid = makeUid(Kind.USERS, collection.playlist_owner_id)
    const collectionUid = collectionUids[collectionId]
    if (collection) {
      yield put(
        cacheActions.subscribe(Kind.USERS, [
          { uid: userUid, id: collection.playlist_owner_id }
        ])
      )
      yield put(
        fetchCollectionSucceeded(
          collection.playlist_id,
          collectionUid,
          userUid,
          collection.playlist_contents.track_ids.length
        )
      )
      if (fetchLineup) {
        yield put(tracksActions.fetchLineupMetadatas(0, 200, false, undefined))
      }
    } else {
      yield put(collectionActions.fetchCollectionFailed(userUid))
    }
  })
}

function* watchResetCollection() {
  yield takeEvery(collectionActions.RESET_COLLECTION, function* (action) {
    yield put(tracksActions.reset())
    yield put(
      cacheActions.unsubscribe(Kind.COLLECTIONS, [
        { uid: action.collectionUid }
      ])
    )
    yield put(cacheActions.unsubscribe(Kind.USERS, [{ uid: action.userUid }]))
  })
}

/**
 * Used for mobile CollectionScreen
 */
function* watchResetAndFetchCollectionTracks() {
  yield takeEvery(
    collectionActions.RESET_AND_FETCH_COLLECTION_TRACKS,
    function* (action) {
      const collectionUid = yield select(getCollectionUid)
      const userUid = yield select(getUserUid)

      if (collectionUid && userUid) {
        // Reset collection so that lineup is not shared between separate instances
        // of the CollectionScreen
        yield put(collectionActions.resetCollection(collectionUid, userUid))
        yield take(tracksActions.reset().type)
      }

      // Need to refetch the collection after resetting
      // Will pull from cache if it exists
      // TODO: fix this for smart collections
      if (typeof collectionId === 'number') {
        yield put(fetchCollection(action.collectionId))
      }

      yield take(fetchCollectionSucceeded)

      yield put(tracksActions.fetchLineupMetadatas(0, 200, false, undefined))
    }
  )
}

export default function sagas() {
  return [
    ...tracksSagas(),
    watchFetchCollection,
    watchResetCollection,
    watchResetAndFetchCollectionTracks
  ]
}
