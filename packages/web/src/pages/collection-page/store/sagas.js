import {
  Kind,
  makeUid,
  cacheActions,
  collectionPageActions as collectionActions,
  collectionPageLineupActions as tracksActions
} from '@audius/common'
import { call, put, takeLatest, takeEvery } from 'redux-saga/effects'

import { retrieveCollections } from 'common/store/cache/collections/utils'
import tracksSagas from 'pages/collection-page/store/lineups/tracks/sagas'

function* watchFetchCollection() {
  yield takeLatest(collectionActions.FETCH_COLLECTION, function* (action) {
    const collectionId = action.id

    const { collections, uids: collectionUids } = yield call(
      retrieveCollections,
      null,
      [collectionId],
      /* fetchTracks */ false,
      /* requiresAllTracks */ true
    )

    if (Object.values(collections).length === 0) {
      yield put(collectionActions.fetchCollectionFailed())
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
        collectionActions.fetchCollectionSucceeded(
          collection.playlist_id,
          collectionUid,
          userUid,
          collection.playlist_contents.track_ids.length
        )
      )
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

export default function sagas() {
  return [...tracksSagas(), watchFetchCollection, watchResetCollection]
}
