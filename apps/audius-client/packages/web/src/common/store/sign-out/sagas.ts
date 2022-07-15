import { takeLatest, put, call } from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import { disablePushNotifications } from 'pages/settings-page/store/mobileSagas'
import { make } from 'store/analytics/actions'
import { signOut } from 'utils/signOut'

import { signOut as signOutAction } from './slice'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchSignOut() {
  yield takeLatest(signOutAction.type, function* () {
    if (NATIVE_MOBILE) {
      disablePushNotifications()
      yield put(make(Name.SETTINGS_LOG_OUT, {}))
      yield call(signOut)
    } else {
      yield put(make(Name.SETTINGS_LOG_OUT, { callback: signOut }))
    }
  })
}

export default function sagas() {
  return [watchSignOut]
}
