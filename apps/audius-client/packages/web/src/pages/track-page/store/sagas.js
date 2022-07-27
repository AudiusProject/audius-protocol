import { Kind } from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import moment from 'moment'
import { call, fork, put, select, takeEvery } from 'redux-saga/effects'

import { StringKeys } from 'common/services/remote-config'
import * as trackCacheActions from 'common/store/cache/tracks/actions'
import { getTrack as getCachedTrack } from 'common/store/cache/tracks/selectors'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { retrieveTrackByHandleAndSlug } from 'common/store/cache/tracks/utils/retrieveTracks'
import { getUsers } from 'common/store/cache/users/selectors'
import * as trackPageActions from 'common/store/pages/track/actions'
import { tracksActions } from 'common/store/pages/track/lineup/actions'
import {
  getSourceSelector,
  getTrack,
  getTrendingTrackRanks,
  getUser
} from 'common/store/pages/track/selectors'
import { getIsReachable } from 'common/store/reachability/selectors'
import { makeUid } from 'common/utils/uid'
import tracksSagas from 'pages/track-page/store/lineups/tracks/sagas'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { waitForBackendSetup } from 'store/backend/sagas'
import { NOT_FOUND_PAGE, trackRemixesPage } from 'utils/route'

export const TRENDING_BADGE_LIMIT = 10

function* watchTrackBadge() {
  yield takeEvery(trackPageActions.GET_TRACK_RANKS, function* (action) {
    try {
      yield call(waitForBackendSetup)
      yield call(remoteConfigInstance.waitForRemoteConfig)
      const TF = new Set(
        remoteConfigInstance.getRemoteVar(StringKeys.TF)?.split(',') ?? []
      )
      let trendingTrackRanks = yield select(getTrendingTrackRanks)
      if (!trendingTrackRanks) {
        const trendingRanks = yield apiClient.getTrendingIds({
          limit: TRENDING_BADGE_LIMIT
        })
        if (TF.size > 0) {
          trendingRanks.week = trendingRanks.week.filter((i) => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
          trendingRanks.month = trendingRanks.month.filter((i) => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
          trendingRanks.year = trendingRanks.year.filter((i) => {
            const shaId = window.Web3.utils.sha3(i.toString())
            return !TF.has(shaId)
          })
        }

        yield put(trackPageActions.setTrackTrendingRanks(trendingRanks))
        trendingTrackRanks = yield select(getTrendingTrackRanks)
      }

      const weeklyTrackIndex = trendingTrackRanks.week.findIndex(
        (trackId) => trackId === action.trackId
      )
      const monthlyTrackIndex = trendingTrackRanks.month.findIndex(
        (trackId) => trackId === action.trackId
      )
      const yearlyTrackIndex = trendingTrackRanks.year.findIndex(
        (trackId) => trackId === action.trackId
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

function* addTrackToLineup(track) {
  const source = yield select(getSourceSelector)
  const formattedTrack = {
    kind: Kind.TRACKS,
    id: track.track_id,
    uid: makeUid(Kind.TRACKS, track.track_id, source)
  }

  yield put(tracksActions.add(formattedTrack, track.track_id))
}

/** Get "more by this artist" and put into the lineup + queue */
function* getRestOfLineup(permalink, ownerHandle) {
  yield put(
    tracksActions.fetchLineupMetadatas(1, 5, false, {
      ownerHandle,
      heroTrackPermalink: permalink
    })
  )
}

function* watchFetchTrack() {
  yield takeEvery(trackPageActions.FETCH_TRACK, function* (action) {
    const { trackId, handle, slug, canBeUnlisted } = action
    const permalink = `/${handle}/${slug}`
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
        yield put(trackPageActions.setTrackId(track.track_id))
        // Add hero track to lineup early so that we can play it ASAP
        // (instead of waiting for the entire lineup to load)
        yield call(addTrackToLineup, track)
        yield fork(getRestOfLineup, permalink, handle)
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
    yield put(
      tracksActions.fetchLineupMetadatas(0, 6, false, {
        ownerHandle: handle,
        heroTrackPermalink: permalink
      })
    )
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
  yield takeEvery(
    trackPageActions.GO_TO_REMIXES_OF_PARENT_PAGE,
    function* (action) {
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
    }
  )
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
