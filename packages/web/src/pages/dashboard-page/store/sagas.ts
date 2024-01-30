import {
  IntKeys,
  accountSelectors,
  walletActions,
  getContext
} from '@audius/common'
import { Collection, ID, Track } from '@audius/common/models'
import { waitForValue, doEvery } from '@audius/common/utils'
import { each } from 'lodash'
import moment from 'moment'
import { EventChannel } from 'redux-saga'
import { all, call, fork, put, take, takeEvery } from 'typed-redux-saga'

import { retrieveUserTracks } from 'common/store/pages/profile/lineups/tracks/retrieveUserTracks'
import { requiresAccount } from 'common/utils/requiresAccount'
import { DASHBOARD_PAGE } from 'utils/route'
import { waitForRead } from 'utils/sagaHelpers'

import { actions as dashboardActions } from './slice'
import ArtistDashboardState from './types'
const { getBalance } = walletActions
const getAccountUser = accountSelectors.getAccountUser

const formatMonth = (date: moment.Moment | string) =>
  moment(date).format('MMM').toUpperCase()

function* fetchDashboardTracksAsync(
  action: ReturnType<typeof dashboardActions.fetchTracks>
) {
  const account = yield* call(waitForValue, getAccountUser)
  const { offset, limit } = action.payload

  try {
    const tracks = yield* call(retrieveUserTracks, {
      handle: account.handle,
      currentUserId: account.user_id,
      offset,
      limit,
      getUnlisted: true
    })
    yield put(dashboardActions.fetchTracksSucceeded({ tracks }))
  } catch (error) {
    console.error(error)
    yield put(dashboardActions.fetchTracksFailed({}))
  }
}

function* fetchDashboardAsync(
  action: ReturnType<typeof dashboardActions.fetch>
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* call(waitForRead)

  const account = yield* call(waitForValue, getAccountUser)
  yield* fork(pollForBalance)

  const { offset, limit } = action.payload
  try {
    const data = yield* all([
      call(retrieveUserTracks, {
        handle: account.handle,
        currentUserId: account.user_id,
        offset,
        limit,
        getUnlisted: true
      }),
      call(audiusBackendInstance.getPlaylists, account.user_id, [])
    ])
    // Casting necessary because yield* all is not typed well
    const tracks = data[0] as Track[]
    const playlists = data[1] as Collection[]

    const trackIds = tracks.map((t) => t.track_id)
    const now = moment()

    yield* put(
      dashboardActions.fetchListenData({
        trackIds,
        start: now.clone().subtract(1, 'years').toISOString(),
        end: now.toISOString(),
        period: 'month'
      })
    )

    if (tracks.length > 0 || playlists.length > 0) {
      yield* put(
        dashboardActions.fetchSucceeded({
          tracks,
          collections: playlists
        })
      )
    } else {
      yield* put(dashboardActions.fetchFailed({}))
    }
  } catch (error) {
    console.error(error)
    yield* put(dashboardActions.fetchFailed({}))
  }
}

function* fetchDashboardListenDataAsync(
  action: ReturnType<typeof dashboardActions.fetchListenData>
) {
  const { start, end } = action.payload
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const account = yield* call(waitForValue, getAccountUser)
  const listenData: {
    [key: string]: {
      totalListens: number
      trackIds: ID[]
      listenCounts: Array<{ trackId: ID; date: string; listens: number }>
    }
  } = yield* call(
    audiusBackendInstance.getUserListenCountsMonthly,
    account.user_id,
    start,
    end
  )
  const labels: string[] = []
  const labelIndexMap: { [key: string]: number } = {}
  const startDate = moment.utc(start)
  const endDate = moment.utc(end)
  while (startDate.isBefore(endDate)) {
    startDate.add(1, 'month').endOf('month')
    const label = formatMonth(startDate)
    labelIndexMap[label] = labels.length
    labels.push(label)
  }

  const formattedListenData: ArtistDashboardState['listenData'] = {
    all: {
      labels: [...labels],
      values: new Array(labels.length).fill(0)
    }
  }
  each(listenData, (data, date) => {
    formattedListenData.all.values[labelIndexMap[formatMonth(date)]] =
      data.totalListens
    data.listenCounts.forEach((count) => {
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
    yield* put(
      dashboardActions.fetchListenDataSucceeded({
        listenData: formattedListenData
      })
    )
  } else {
    yield* put(dashboardActions.fetchListenDataFailed({}))
  }
}

function* pollForBalance() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  const pollingFreq = remoteConfigInstance.getRemoteVar(
    IntKeys.DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS
  )
  const chan = (yield* call(doEvery, pollingFreq || 1000, function* () {
    yield* put(getBalance())
  })) as unknown as EventChannel<any>
  yield* take(dashboardActions.reset.type)
  chan.close()
}

function* watchFetchDashboardTracks() {
  yield takeEvery(
    dashboardActions.fetchTracks,
    requiresAccount(fetchDashboardTracksAsync, DASHBOARD_PAGE)
  )
}

function* watchFetchDashboard() {
  yield* takeEvery(
    dashboardActions.fetch.type,
    requiresAccount(fetchDashboardAsync, DASHBOARD_PAGE)
  )
}

function* watchFetchDashboardListenData() {
  yield* takeEvery(
    dashboardActions.fetchListenData.type,
    fetchDashboardListenDataAsync
  )
}

export default function sagas() {
  return [
    watchFetchDashboard,
    watchFetchDashboardTracks,
    watchFetchDashboardListenData
  ]
}
