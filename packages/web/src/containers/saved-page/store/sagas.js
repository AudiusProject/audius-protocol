import { takeLatest, call, put, fork, select } from 'redux-saga/effects'
import moment from 'moment'

import * as actions from './actions'
import { tracksActions } from './lineups/tracks/actions'
import tracksSagas from 'containers/saved-page/store/lineups/tracks/sagas'
import { getAccountUser } from 'store/account/selectors'
import { waitForValue } from 'utils/sagaHelpers'
import AudiusBackend from 'services/AudiusBackend'
import { getSaves } from './selectors'

const sortBySaveCreatedAt = (a, b) =>
  moment(b.created_at) - moment(a.created_at)

function* fetchTracksLineup() {
  yield put(tracksActions.fetchLineupMetadatas())
}

function* watchFetchSaves() {
  yield takeLatest(actions.FETCH_SAVES, function* () {
    const account = yield call(waitForValue, getAccountUser)
    const limit = account.track_save_count

    const saves = yield select(getSaves)
    // Don't refetch saves in the same session
    if (saves && saves.length) {
      yield fork(fetchTracksLineup)
    } else {
      try {
        const savedTracks = (yield call(
          AudiusBackend.getSavedTracks,
          limit
        )).sort(sortBySaveCreatedAt)
        yield put(actions.fetchSavesSucceeded(savedTracks))

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
