import { Name } from '@audius/common'
import { takeLatest, put, call } from 'redux-saga/effects'

import { resetAccount } from 'common/store/account/reducer'
import { make } from 'common/store/analytics/actions'
import { disablePushNotifications } from 'pages/settings-page/store/mobileSagas'
import { signOut } from 'utils/signOut'

import { getContext } from '../effects'

import { signOut as signOutAction } from './slice'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchSignOut() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const localStorage = yield* getContext('localStorage')
  yield takeLatest(signOutAction.type, function* () {
    yield put(resetAccount())
    if (NATIVE_MOBILE) {
      disablePushNotifications(audiusBackendInstance)
      yield put(make(Name.SETTINGS_LOG_OUT, {}))
      yield call(signOut, audiusBackendInstance, localStorage)
    } else {
      yield put(
        make(Name.SETTINGS_LOG_OUT, {
          callback: () => signOut(audiusBackendInstance, localStorage)
        })
      )
    }
  })
}

export default function sagas() {
  return [watchSignOut]
}
