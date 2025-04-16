import {
  collectionPageLineupActions as tracksActions,
  collectionPageActions as collectionActions
} from '@audius/common/store'
import { put, takeEvery } from 'redux-saga/effects'

import tracksSagas from './lineups/sagas'

function* watchResetCollection() {
  yield takeEvery(collectionActions.RESET_COLLECTION, function* () {
    yield put(tracksActions.reset())
  })
}

export default function sagas() {
  return [...tracksSagas(), watchResetCollection]
}
