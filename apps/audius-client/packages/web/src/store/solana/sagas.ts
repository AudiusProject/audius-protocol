import { put, call, take } from 'typed-redux-saga'

import { getContext } from 'common/store'
import * as backendActions from 'common/store/backend/actions'
import { setFeePayer } from 'common/store/solana/slice'

function* watchForFeePayer() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield take(backendActions.SETUP_BACKEND_SUCCEEDED)
  const { feePayer, error } = yield* call(
    audiusBackendInstance.getRandomFeePayer as () => Promise<
      | {
          feePayer: string
          error: undefined
        }
      | { feePayer: undefined; error: boolean }
    >
  )
  if (error) {
    console.error('Could not get fee payer.')
  } else {
    yield put(setFeePayer({ feePayer: feePayer as string }))
  }
}

const sagas = () => {
  return [watchForFeePayer]
}

export default sagas
