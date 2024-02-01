import { call, put, select, takeLatest } from 'typed-redux-saga'

import { getContext } from '~/store/effects'
import { UPLOAD_TRACKS_SUCCEEDED } from '~/store/upload/actions'

import { getUserId, getUserHandle } from './selectors'
import { fetchAccountSucceeded, fetchHasTracks, setHasTracks } from './slice'

function* handleFetchTrackCount() {
  const currentUserId = yield* select(getUserId)
  const handle = yield* select(getUserHandle)
  const apiClient = yield* getContext('apiClient')

  if (!currentUserId || !handle) return

  try {
    const tracks = yield* call([apiClient, apiClient.getUserTracksByHandle], {
      handle,
      currentUserId,
      getUnlisted: true
    })

    yield* put(setHasTracks(tracks.length > 0))
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
