import { put, takeLatest } from 'redux-saga/effects'

import {
  REQUEST_NATIVE_OPEN_POPUP,
  nativeOpenPopup,
  SET_CREDENTIALS,
  SetCredentialsAction,
  RequestNativeOpenPopupAction
} from './actions'

function* watchRequestNativeOpenPopup() {
  yield takeLatest(
    REQUEST_NATIVE_OPEN_POPUP,
    function* ({
      resolve,
      reject,
      url,
      provider
    }: RequestNativeOpenPopupAction) {
      yield put(nativeOpenPopup(url, provider))

      yield takeLatest(
        SET_CREDENTIALS,
        function* ({ credentials }: SetCredentialsAction) {
          if (!credentials.error) {
            resolve(credentials)
          } else {
            reject(new Error(credentials.error))
          }
        }
      )
    }
  )
}

const sagas = () => {
  return [watchRequestNativeOpenPopup]
}

export default sagas
