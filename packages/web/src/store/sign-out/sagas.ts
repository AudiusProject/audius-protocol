import { Name } from '@audius/common/models'
import {
  accountActions,
  tokenDashboardPageActions,
  signOutActions,
  getContext
} from '@audius/common/store'
import { takeLatest, put } from 'redux-saga/effects'

import { make } from 'common/store/analytics/actions'
import { signOut } from 'store/sign-out/signOut'
const { resetAccount, unsubscribeBrowserPushNotifications } = accountActions
const { resetState: resetWalletState } = tokenDashboardPageActions
const { signOut: signOutAction } = signOutActions

function* watchSignOut() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const localStorage = yield* getContext('localStorage')
  const hedgehogInstance = yield* getContext('hedgehogInstance')
  yield takeLatest(signOutAction.type, function* () {
    yield put(resetAccount())
    yield put(unsubscribeBrowserPushNotifications())
    yield put(resetWalletState())
    yield put(
      make(Name.SETTINGS_LOG_OUT, {
        callback: () =>
          signOut(audiusBackendInstance, localStorage, hedgehogInstance)
      })
    )
  })
}

export default function sagas() {
  return [watchSignOut]
}
