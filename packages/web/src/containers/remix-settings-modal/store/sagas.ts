import { takeEvery, call, put } from 'redux-saga/effects'
import { matchPath } from 'react-router-dom'

import { fetchTrack, fetchTrackSucceeded, fetchTrackFailed } from './slice'
import { TRACK_PAGE } from 'utils/route'
import { parseIdFromRoute } from 'containers/track-page/TrackPageProvider'
import { retrieveTracks } from 'store/cache/tracks/utils/retrieveTracks'

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
    // Match on the pathname and return a valid track id if found
    const match = matchPath<{ trackName: string; handle: string }>(pathname, {
      path: TRACK_PAGE,
      exact: true
    })
    if (match && match.params.trackName) {
      const { trackId } = parseIdFromRoute(match.params.trackName)
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
