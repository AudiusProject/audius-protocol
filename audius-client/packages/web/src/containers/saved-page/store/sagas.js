import { takeLatest, call, put, fork, select } from 'redux-saga/effects'

import * as actions from './actions'
import { tracksActions } from './lineups/tracks/actions'
import tracksSagas from 'containers/saved-page/store/lineups/tracks/sagas'
import { getAccountUser } from 'store/account/selectors'
import { waitForValue } from 'utils/sagaHelpers'
import { getSaves } from './selectors'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

function* fetchTracksLineup() {
  yield put(tracksActions.fetchLineupMetadatas())
}

function* watchFetchSaves() {
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
        const tracks = savedTracks.map(save => save.track)

        yield processAndCacheTracks(tracks)

        const saves = savedTracks.map(save => ({
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
