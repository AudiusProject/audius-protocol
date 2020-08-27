import { takeEvery, call, put } from 'redux-saga/effects'

import { fetchTrack, fetchTrackSucceeded, fetchTrackFailed } from './slice'
import { retrieveTracks } from 'store/cache/tracks/utils/retrieveTracks'
import { parseTrackRoute } from 'utils/route/trackRouteParser'

const getTrackId = (url: string) => {
  // Get just the pathname part from the url
  try {
    const trackUrl = new URL(url)
    const pathname = trackUrl.pathname

    if (
      trackUrl.hostname !== process.env.REACT_APP_PUBLIC_HOSTNAME &&
      trackUrl.hostname !== window.location.hostname
    ) {
      return null
    }
    const params = parseTrackRoute(pathname)
    if (params) {
      const { trackId } = params
      return trackId
    }
    return null
  } catch (err) {
    return null
  }
}

function* watchFetchTrack() {
  yield takeEvery(fetchTrack.type, function* (
    action: ReturnType<typeof fetchTrack>
  ) {
    const { url } = action.payload
    const trackId = getTrackId(url)
    if (trackId) {
      const track = yield call(retrieveTracks, { trackIds: [trackId] })
      if (track) {
        yield put(fetchTrackSucceeded({ trackId }))
        return
      }
    }
    yield put(fetchTrackFailed())
  })
}

export default function sagas() {
  return [watchFetchTrack]
}
