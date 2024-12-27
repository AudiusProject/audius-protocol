import { Name } from '@audius/common/models'
import { TRENDING_PAGE } from '@audius/common/src/utils/route'
import {
  accountActions,
  tokenDashboardPageActions,
  signOutActions,
  getContext
} from '@audius/common/store'
import { takeLatest, put } from 'redux-saga/effects'

import { make } from 'common/store/analytics/actions'
import { signOut } from 'store/sign-out/signOut'
import { push } from 'utils/navigation'
const { resetAccount, unsubscribeBrowserPushNotifications } = accountActions
const { resetState: resetWalletState } = tokenDashboardPageActions
const { signOut: signOutAction } = signOutActions

function* watchSignOut() {
  const localStorage = yield* getContext('localStorage')
  const authService = yield* getContext('authService')
  yield takeLatest(signOutAction.type, function* () {
    yield put(resetAccount())
    yield put(unsubscribeBrowserPushNotifications())
    yield put(resetWalletState())
    yield put(
      make(Name.SETTINGS_LOG_OUT, {
        callback: () => signOut(localStorage, authService)
      })
    )
    yield put(push(TRENDING_PAGE))
  })
}

export default function sagas() {
  return [watchSignOut]
}
