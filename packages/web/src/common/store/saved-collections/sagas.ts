import { savedCollectionsActions, waitForRead } from '@audius/common'
import { call, put, takeEvery } from 'typed-redux-saga'

import { retrieveCollections } from '../cache/collections/utils'

const { fetchCollections, fetchCollectionsSucceeded } = savedCollectionsActions

function* fetchCollectionsAsync(action: ReturnType<typeof fetchCollections>) {
  const { type, ids } = action.payload
  yield waitForRead()

  yield* call(retrieveCollections, ids)

  yield put(
    fetchCollectionsSucceeded({
      type
    })
  )
}

function* watchFetchCollections() {
  yield takeEvery(fetchCollections.type, fetchCollectionsAsync)
}

export default function sagas() {
  return [watchFetchCollections]
}
