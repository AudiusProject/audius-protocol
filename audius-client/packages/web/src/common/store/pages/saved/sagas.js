import {
  accountSelectors,
  savedPageTracksLineupActions as tracksActions,
  savedPageActions as actions,
  savedPageSelectors,
  waitForValue,
  FeatureFlags
} from '@audius/common'
import {
  takeLatest,
  call,
  put,
  fork,
  select,
  getContext
} from 'redux-saga/effects'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

import tracksSagas from './lineups/sagas'
const { getSaves } = savedPageSelectors
const { getAccountUser } = accountSelectors

function* fetchTracksLineup() {
  yield put(tracksActions.fetchLineupMetadatas())
}

function* watchFetchSaves() {
  const apiClient = yield getContext('apiClient')
  let currentQuery = ''
  let currentSortMethod = ''
  let currentSortDirection = ''

  yield takeLatest(actions.FETCH_SAVES, function* (props) {
    const account = yield call(waitForValue, getAccountUser)
    const userId = account.user_id
    const offset = props.offset ?? 0
    const limit = props.limit ?? account.track_save_count
    const query = props.query ?? ''
    const sortMethod = props.sortMethod ?? ''
    const sortDirection = props.sortDirection ?? ''
    const saves = yield select(getSaves)
    const getFeatureEnabled = yield getContext('getFeatureEnabled')
    const newTablesEnabled = yield call(
      getFeatureEnabled,
      FeatureFlags.NEW_TABLES
    ) ?? false

    const isSameParams =
      query === currentQuery &&
      currentSortDirection === sortDirection &&
      currentSortMethod === sortMethod

    // Don't refetch saves in the same session
    if (saves && saves.length && isSameParams) {
      yield fork(fetchTracksLineup)
    } else {
      try {
        currentQuery = query
        currentSortDirection = sortDirection
        currentSortMethod = sortMethod
        yield put(actions.fetchSavesRequested())

        const savedTracks = yield apiClient.getFavoritedTracks({
          currentUserId: userId,
          profileUserId: userId,
          offset,
          limit,
          query,
          sortMethod,
          sortDirection
        })
        const tracks = savedTracks.map((save) => save.track)

        yield processAndCacheTracks(tracks)

        const saves = savedTracks.map((save) => ({
          created_at: save.timestamp,
          save_item_id: save.track.track_id
        }))

        const fullSaves = Array(account.track_save_count)
          .fill(0)
          .map((_) => ({}))

        fullSaves.splice(offset, saves.length, ...saves)

        yield put(
          actions.fetchSavesSucceeded(newTablesEnabled ? fullSaves : saves)
        )
        if (limit > 0 && saves.length < limit) {
          yield put(actions.endFetching(offset + saves.length))
        }
        yield fork(fetchTracksLineup)
      } catch (e) {
        yield put(actions.fetchSavesFailed())
      }
    }
  })
}

function* watchFetchMoreSaves() {
  const apiClient = yield getContext('apiClient')
  yield takeLatest(actions.FETCH_MORE_SAVES, function* (props) {
    const account = yield call(waitForValue, getAccountUser)
    const userId = account.user_id
    const offset = props.offset ?? 0
    const limit = props.limit ?? account.track_save_count
    const query = props.query ?? ''
    const sortMethod = props.sortMethod ?? ''
    const sortDirection = props.sortDirection ?? ''

    try {
      const savedTracks = yield apiClient.getFavoritedTracks({
        currentUserId: userId,
        profileUserId: userId,
        offset,
        limit,
        query,
        sortMethod,
        sortDirection
      })
      const tracks = savedTracks.map((save) => save.track)

      yield processAndCacheTracks(tracks)

      const saves = savedTracks.map((save) => ({
        created_at: save.timestamp,
        save_item_id: save.track.track_id
      }))
      yield put(actions.fetchMoreSavesSucceeded(saves, offset))

      if (limit > 0 && saves.length < limit) {
        yield put(actions.endFetching(offset + saves.length))
      }
      yield fork(fetchTracksLineup)
    } catch (e) {
      yield put(actions.fetchMoreSavesFailed())
    }
  })
}

export default function sagas() {
  return [...tracksSagas(), watchFetchSaves, watchFetchMoreSaves]
}
