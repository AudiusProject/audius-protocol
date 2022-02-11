import { put, call, take } from 'typed-redux-saga'

import { setFeePayer } from 'common/store/solana/slice'
import AudiusBackend from 'services/AudiusBackend'
import * as backendActions from 'store/backend/actions'

function* watchForFeePayer() {
  yield take(backendActions.SETUP_BACKEND_SUCCEEDED)
  const { feePayer, error } = yield* call(AudiusBackend.getRandomFeePayer)
  if (error) {
    console.error('Could not get fee payer.')
  } else {
    yield put(setFeePayer({ feePayer }))
  }
}

const sagas = () => {
  return [watchForFeePayer]
}

export default sagas
