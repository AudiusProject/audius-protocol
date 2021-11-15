import { each } from 'lodash'
import moment from 'moment'
import { all, call, put, take, takeEvery } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { formatUrlName } from 'common/utils/formatUtil'
import { retrieveUserTracks } from 'containers/profile-page/store/lineups/tracks/retrieveUserTracks'
import AudiusBackend from 'services/AudiusBackend'
import { getRemoteVar, IntKeys } from 'services/remote-config'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getBalance } from 'store/wallet/slice'
import { DASHBOARD_PAGE } from 'utils/route'
import { doEvery, requiresAccount, waitForValue } from 'utils/sagaHelpers'

import * as dashboardActions from './actions'

function* fetchDashboardAsync(action) {
  yield call(waitForBackendSetup)

  const account = yield call(waitForValue, getAccountUser)

  const [tracks, playlists] = yield all([
    call(retrieveUserTracks, {
      handle: account.handle,
      currentUserId: account.user_id,
      // TODO: This only supports up to 500, we need to redesign / paginate
      // the dashboard
      limit: account.track_count
    }),
    call(AudiusBackend.getPlaylists, account.user_id, [])
  ])

  const trackIds = tracks.map(t => t.track_id)
  const now = moment()

  yield call(fetchDashboardListenDataAsync, {
    trackIds: trackIds,
    start: now.clone().subtract(1, 'years').toISOString(),
    end: now.toISOString(),
    period: 'month'
  })

  // CreatorNode returns us a response of type { tracks: [{ title, id }] }
  const unlistedTracksIdentifiers = yield call(AudiusBackend.getUnlistedTracks)

  // Create routeURLs
  const identifiersWithRouteURL = unlistedTracksIdentifiers.map(t => ({
    id: parseInt(t.id),
    handle: account.handle,
    url_title: formatUrlName(t.title)
  }))

  // Hit discprov to get the full unlisted tracks
  let fullUnlistedTracks = []
  if (unlistedTracksIdentifiers.length) {
    fullUnlistedTracks = yield call(retrieveTracks, {
      trackIds: identifiersWithRouteURL,
      canBeUnlisted: true
    })
  }

  if (
    tracks.length > 0 ||
    playlists.length > 0 ||
    fullUnlistedTracks.length > 0
  ) {
    yield put(
      dashboardActions.fetchDashboardSucceeded(
        tracks,
        playlists,
        fullUnlistedTracks
      )
    )
    yield call(pollForBalance)
  } else {
    yield put(dashboardActions.fetchDashboardFailed())
  }
}

const formatMonth = date => moment.utc(date).format('MMM').toUpperCase()

function* fetchDashboardListenDataAsync(action) {
  const listenData = yield call(
    AudiusBackend.getTrackListens,
    action.trackIds,
    action.start,
    action.end,
    action.period
  )

  const labels = []
  const labelIndexMap = {}
  const startDate = moment.utc(action.start)
  const endDate = moment.utc(action.end)
  while (startDate.isBefore(endDate)) {
    startDate.add(1, 'month').endOf('month')
    const label = formatMonth(startDate)
    labelIndexMap[label] = labels.length
    labels.push(label)
  }

  const formattedListenData = {
    all: {
      labels: [...labels],
      values: new Array(labels.length).fill(0)
    }
  }
  each(listenData, (data, date) => {
    formattedListenData.all.values[labelIndexMap[formatMonth(date)]] =
      data.totalListens
    data.listenCounts.forEach(count => {
      if (!(count.trackId in formattedListenData)) {
        formattedListenData[count.trackId] = {
          labels: [...labels],
          values: new Array(labels.length).fill(0)
        }
      }
      formattedListenData[count.trackId].values[
        labelIndexMap[formatMonth(date)]
      ] = count.listens
    })
  })

  if (listenData) {
    yield put(
      dashboardActions.fetchDashboardListenDataSucceeded(formattedListenData)
    )
  } else {
    yield put(dashboardActions.fetchDashboardListenDataFailed())
  }
}

function* pollForBalance() {
  const pollingFreq = getRemoteVar(
    IntKeys.DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS
  )
  const chan = yield call(doEvery, pollingFreq, function* () {
    yield put(getBalance())
  })
  yield take(dashboardActions.RESET_DASHBOARD)
  chan.close()
}

function* watchFetchDashboard() {
  yield takeEvery(
    dashboardActions.FETCH_DASHBOARD,
    requiresAccount(fetchDashboardAsync, DASHBOARD_PAGE)
  )
}

function* watchFetchDashboardListenData() {
  yield takeEvery(
    dashboardActions.FETCH_DASHBOARD_LISTEN_DATA,
    fetchDashboardListenDataAsync
  )
}

export default function sagas() {
  return [watchFetchDashboard, watchFetchDashboardListenData]
}
