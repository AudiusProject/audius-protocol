import {
  Kind,
  makeUid,
  cacheActions,
  collectionPageActions as collectionActions,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors
} from '@audius/common'
import { call, put, select, takeLatest, takeEvery } from 'redux-saga/effects'

import {
  retrieveCollections,
  retrieveCollectionByPermalink
} from 'common/store/cache/collections/utils'

import tracksSagas from './lineups/sagas'
const { getCollectionUid, getUserUid } = collectionPageSelectors
const { fetchCollectionSucceeded, fetchCollectionFailed } = collectionActions

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
    const identifier = collectionId || permalink
    const collection = collections[identifier]
    const userUid = makeUid(Kind.USERS, collection.playlist_owner_id)
    const collectionUid = collectionUids[identifier]
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
          collection.permalink,
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
  yield takeEvery(collectionActions.RESET_COLLECTION, function* () {
    const collectionUid = yield select(getCollectionUid)
    const userUid = yield select(getUserUid)

    yield put(tracksActions.reset())
    yield put(
      cacheActions.unsubscribe(Kind.COLLECTIONS, [{ uid: collectionUid }])
    )
    yield put(cacheActions.unsubscribe(Kind.USERS, [{ uid: userUid }]))
  })
}

export default function sagas() {
  return [...tracksSagas(), watchFetchCollection, watchResetCollection]
}
