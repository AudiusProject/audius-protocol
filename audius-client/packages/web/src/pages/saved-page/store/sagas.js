import {
  accountSelectors,
  savedPageTracksLineupActions as tracksActions,
  savedPageActions as actions,
  savedPageSelectors,
  waitForValue
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

import tracksSagas from './lineups/tracks/sagas'
const { getSaves } = savedPageSelectors
const getAccountUser = accountSelectors.getAccountUser

function* fetchTracksLineup() {
  yield put(tracksActions.fetchLineupMetadatas())
}

function* watchFetchSaves() {
  const apiClient = yield getContext('apiClient')
  yield takeLatest(actions.FETCH_SAVES, function* () {
    const account = yield call(waitForValue, getAccountUser)
    const userId = account.user_id
    const limit = account.track_save_count
    const saves = yield select(getSaves)
    // Don't refetch saves in the same session
    if (saves && saves.length) {
      yield fork(fetchTracksLineup)
    } else {
      try {
        const savedTracks = yield apiClient.getFavoritedTracks({
          currentUserId: userId,
          profileUserId: userId,
          offset: 0,
          limit
        })
        const tracks = savedTracks.map((save) => save.track)

        yield processAndCacheTracks(tracks)

        const saves = savedTracks.map((save) => ({
          created_at: save.timestamp,
          save_item_id: save.track.track_id
        }))
        yield put(actions.fetchSavesSucceeded(saves))

        yield fork(fetchTracksLineup)
      } catch (e) {
        yield put(actions.fetchSavesFailed())
      }
    }
  })
}

export default function sagas() {
  return [...tracksSagas(), watchFetchSaves]
}
