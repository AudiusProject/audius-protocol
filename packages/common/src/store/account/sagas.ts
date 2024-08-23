import { call, put, select, takeLatest } from 'typed-redux-saga'

import { Id } from '~/models'
import { UPLOAD_TRACKS_SUCCEEDED } from '~/store/upload/actions'

import { getSDK } from '../sdkUtils'

import { getUserId, getUserHandle } from './selectors'
import { fetchAccountSucceeded, fetchHasTracks, setHasTracks } from './slice'

function* handleFetchTrackCount() {
  const currentUserId = yield* select(getUserId)
  const handle = yield* select(getUserHandle)
  const sdk = yield* getSDK()

  if (!currentUserId || !handle) return

  try {
    const { data = [] } = yield* call(
      [sdk.full.users, sdk.full.users.getTracksByUserHandle],
      {
        handle,
        userId: Id.parse(currentUserId),
        limit: 1
      }
    )

    yield* put(setHasTracks(data.length > 0))
  } catch (e) {
    console.warn('failed to fetch own user tracks')
  }
}

function* handleFetchAccount() {
  yield* put(fetchHasTracks())
}

function* handleUploadTrack() {
  yield* put(setHasTracks(true))
}

export function* watchFetchTrackCount() {
  yield* takeLatest(fetchHasTracks, handleFetchTrackCount)
}

export function* watchFetchAccount() {
  yield* takeLatest(fetchAccountSucceeded, handleFetchAccount)
}

export function* watchUploadTrack() {
  yield* takeLatest(UPLOAD_TRACKS_SUCCEEDED, handleUploadTrack)
}

export default function sagas() {
  return [watchFetchTrackCount, watchFetchAccount, watchUploadTrack]
}
