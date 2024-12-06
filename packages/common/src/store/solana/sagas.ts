import { put, call } from 'typed-redux-saga'

import { getSDK } from '../sdkUtils'

import { setFeePayer } from './slice'

function* watchForFeePayer() {
  const sdk = yield* getSDK()
  const feePayer = yield* call([
    sdk.services.solanaRelay,
    sdk.services.solanaRelay.getFeePayer
  ])
  yield put(setFeePayer({ feePayer: feePayer.toString() }))
}

export const sagas = () => {
  return [watchForFeePayer]
}
