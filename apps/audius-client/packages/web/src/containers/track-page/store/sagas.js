import moment from 'moment'
import { fork, call, put, select, takeEvery } from 'redux-saga/effects'

import tracksSagas from 'containers/track-page/store/lineups/tracks/sagas'
import * as trackPageActions from './actions'
import * as trackCacheActions from 'store/cache/tracks/actions'
import { tracksActions } from './lineups/tracks/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getIsReachable } from 'store/reachability/selectors'
import { getTrack as getCachedTrack } from 'store/cache/tracks/selectors'
import { getTrack, getTrendingTrackRanks, getUser } from './selectors'
import { push as pushRoute } from 'connected-react-router'
import { retrieveTracks } from 'store/cache/tracks/utils'
import { NOT_FOUND_PAGE, trackRemixesPage } from 'utils/route'
import { getUsers } from 'store/cache/users/selectors'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

export const TRENDING_BADGE_LIMIT = 10

function* watchTrackBadge() {
  yield takeEvery(trackPageActions.GET_TRACK_RANKS, function* (action) {
    try {
      yield call(waitForBackendSetup)
      let trendingTrackRanks = yield select(getTrendingTrackRanks)
      if (!trendingTrackRanks) {
        const trendingRanks = yield apiClient.getTrendingIds({
          limit: TRENDING_BADGE_LIMIT
        })

        yield put(trackPageActions.setTrackTrendingRanks(trendingRanks))
        trendingTrackRanks = yield select(getTrendingTrackRanks)
      }

      const weeklyTrackIndex = trendingTrackRanks.week.findIndex(
        trackId => trackId === action.trackId
      )
      const monthlyTrackIndex = trendingTrackRanks.month.findIndex(
        trackId => trackId === action.trackId
      )
      const yearlyTrackIndex = trendingTrackRanks.year.findIndex(
        trackId => trackId === action.trackId
      )

      yield put(
        trackPageActions.setTrackRank(
          'week',
          weeklyTrackIndex !== -1 ? weeklyTrackIndex + 1 : null
        )
      )
      yield put(
        trackPageActions.setTrackRank(
          'month',
          monthlyTrackIndex !== -1 ? monthlyTrackIndex + 1 : null
        )
      )
      yield put(
        trackPageActions.setTrackRank(
          'year',
          yearlyTrackIndex !== -1 ? yearlyTrackIndex + 1 : null
        )
      )
    } catch (error) {
      console.error(`Unable to fetch track badge: ${error.message}`)
    }
  })
}

function* getTrackRanks(trackId) {
  yield put(trackPageActions.getTrackRanks(trackId))
}

function* getMoreByThisArtist(trackId, ownerHandle) {
  yield put(
    tracksActions.fetchLineupMetadatas(0, 6, false, {
      ownerHandle,
      trackId
    })
  )
}

function* watchFetchTrack() {
  yield takeEvery(trackPageActions.FETCH_TRACK, function* (action) {
    const { trackId, trackName, ownerHandle, canBeUnlisted } = action
    const ids = canBeUnlisted
      ? [{ id: trackId, url_title: trackName, handle: ownerHandle }]
      : [trackId]

    try {
      yield fork(getMoreByThisArtist, trackId, ownerHandle)
      const trackIds = yield call(retrieveTracks, {
        trackIds: ids,
        canBeUnlisted,
        withStems: true,
        withRemixes: true,
        withRemixParents: true
      })
      if (
        !trackIds ||
        !trackIds.length ||
        trackIds.every(track => track === undefined || !track.track_id)
      ) {
        // If no tracks because no internet, do nothing. Else navigate to 404.
        const isReachable = yield select(getIsReachable)
        if (isReachable) {
          yield put(pushRoute(NOT_FOUND_PAGE))
          return
        }
      }

      yield fork(getTrackRanks, trackId)

      yield put(trackPageActions.fetchTrackSucceeded(trackId))
    } catch (e) {
      console.error(e)
      yield put(trackPageActions.fetchTrackFailed)
    }
  })
}

function* watchFetchTrackSucceeded() {
  yield takeEvery(trackPageActions.FETCH_TRACK_SUCCEEDED, function* (action) {
    const { trackId } = action
    const track = yield select(getCachedTrack, { id: trackId })
    if (
      track.download &&
      track.download.is_downloadable &&
      !track.download.cid
    ) {
      yield put(trackCacheActions.checkIsDownloadable(track.track_id))
    }
  })
}

function* watchRefetchLineup() {
  yield takeEvery(trackPageActions.REFETCH_LINEUP, function* (action) {
    const { track_id } = yield select(getTrack)
    const { handle } = yield select(getUser)
    yield put(tracksActions.reset())
    yield call(getMoreByThisArtist, track_id, handle)
  })
}

function* watchTrackPageMakePublic() {
  yield takeEvery(trackPageActions.MAKE_TRACK_PUBLIC, function* (action) {
    const { trackId } = action
    let track = yield select(getCachedTrack, { id: trackId })

    track = {
      ...track,
      is_unlisted: false,
      release_date: moment().toString(),
      field_visibility: {
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true,
        remixes: track.field_visibility?.remixes ?? true
      }
    }

    yield put(trackCacheActions.editTrack(trackId, track))
  })
}

function* watchGoToRemixesOfParentPage() {
  yield takeEvery(trackPageActions.GO_TO_REMIXES_OF_PARENT_PAGE, function* (
    action
  ) {
    const { parentTrackId } = action
    if (parentTrackId) {
      const parentTrack = (yield call(retrieveTracks, {
        trackIds: [parentTrackId]
      }))[0]
      if (parentTrack) {
        const parentTrackUser = (yield select(getUsers, {
          ids: [parentTrack.owner_id]
        }))[parentTrack.owner_id]
        if (parentTrackUser) {
          const route = trackRemixesPage(
            parentTrackUser.handle,
            parentTrack.title,
            parentTrack.track_id
          )
          yield put(pushRoute(route))
        }
      }
    }
  })
}

export default function sagas() {
  return [
    ...tracksSagas(),
    watchFetchTrack,
    watchFetchTrackSucceeded,
    watchRefetchLineup,
    watchTrackBadge,
    watchTrackPageMakePublic,
    watchGoToRemixesOfParentPage
  ]
}
