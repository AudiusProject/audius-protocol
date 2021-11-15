import { push as pushRoute } from 'connected-react-router'
import moment from 'moment'
import { fork, call, put, select, takeEvery } from 'redux-saga/effects'

import TimeRange from 'common/models/TimeRange'
import * as trackCacheActions from 'common/store/cache/tracks/actions'
import { getTrack as getCachedTrack } from 'common/store/cache/tracks/selectors'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { retrieveTrackByHandleAndSlug } from 'common/store/cache/tracks/utils/retrieveTracks'
import { getUsers } from 'common/store/cache/users/selectors'
import tracksSagas from 'containers/track-page/store/lineups/tracks/sagas'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { StringKeys } from 'services/remote-config'
import {
  getRemoteVar,
  waitForRemoteConfig
} from 'services/remote-config/Provider'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getIsReachable } from 'store/reachability/selectors'
import { NOT_FOUND_PAGE, trackRemixesPage } from 'utils/route'

import * as trackPageActions from './actions'
import { tracksActions } from './lineups/tracks/actions'
import { retrieveTrending } from './retrieveTrending'
import { getTrack, getTrendingTrackRanks, getUser } from './selectors'

export const TRENDING_BADGE_LIMIT = 10

function* watchTrackBadge() {
  yield takeEvery(trackPageActions.GET_TRACK_RANKS, function* (action) {
    try {
      yield call(waitForBackendSetup)
      yield call(waitForRemoteConfig)
      const TF = new Set(getRemoteVar(StringKeys.TF)?.split(',') ?? [])
      let trendingTrackRanks = yield select(getTrendingTrackRanks)
      if (!trendingTrackRanks) {
        const trendingRanks = yield apiClient.getTrendingIds({
          limit: TRENDING_BADGE_LIMIT
        })
        if (TF.size > 0) {
          trendingRanks.week = trendingRanks.week.filter(i => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
          trendingRanks.month = trendingRanks.month.filter(i => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
          trendingRanks.year = trendingRanks.year.filter(i => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
        }

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

function* getMoreByThisArtist(permalink, ownerHandle) {
  yield put(
    tracksActions.fetchLineupMetadatas(0, 6, false, {
      ownerHandle,
      permalink
    })
  )
}

function* watchFetchTrack() {
  yield takeEvery(trackPageActions.FETCH_TRACK, function* (action) {
    const { trackId, handle, slug, canBeUnlisted } = action
    const permalink = `/${handle}/${slug}`
    yield fork(getMoreByThisArtist, permalink, handle)
    try {
      let track
      if (!trackId) {
        track = yield call(retrieveTrackByHandleAndSlug, {
          handle,
          slug,
          withStems: true,
          withRemixes: true,
          withRemixParents: true
        })
      } else {
        const ids = canBeUnlisted
          ? [{ id: trackId, url_title: slug, handle }]
          : [trackId]
        const tracks = yield call(retrieveTracks, {
          trackIds: ids,
          canBeUnlisted,
          withStems: true,
          withRemixes: true,
          withRemixParents: true
        })
        track = tracks && tracks.length === 1 ? tracks[0] : null
      }
      if (!track) {
        const isReachable = yield select(getIsReachable)
        if (isReachable) {
          yield put(pushRoute(NOT_FOUND_PAGE))
          return
        }
      } else {
        yield fork(getTrackRanks, track.track_id)
        yield put(trackPageActions.fetchTrackSucceeded(track.track_id))
      }
    } catch (e) {
      console.error(e)
      yield put(
        trackPageActions.fetchTrackFailed(trackId ?? `/${handle}/${slug}`)
      )
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
    const { permalink } = yield select(getTrack)
    const { handle } = yield select(getUser)
    yield put(tracksActions.reset())
    yield call(getMoreByThisArtist, permalink, handle)
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
          const route = trackRemixesPage(parentTrack.permalink)
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
