import { Name } from '@audius/common/models'
import { TRENDING_PAGE } from '@audius/common/src/utils/route'
import {
  accountActions,
  tokenDashboardPageActions,
  signOutActions,
  getContext
} from '@audius/common/store'
import { disconnect } from '@wagmi/core'
import { takeLatest, put, call } from 'redux-saga/effects'

import { make } from 'common/store/analytics/actions'
import { wagmiConfig } from 'services/audius-sdk/wagmi'
import { signOut } from 'store/sign-out/signOut'
import { push } from 'utils/navigation'
const { resetAccount, unsubscribeBrowserPushNotifications } = accountActions
const { resetState: resetWalletState } = tokenDashboardPageActions
const { signOut: signOutAction } = signOutActions

function* watchSignOut() {
  const localStorage = yield* getContext('localStorage')
  const authService = yield* getContext('authService')
  yield takeLatest(signOutAction.type, function* () {
    if (wagmiConfig.state.status === 'connected') {
      yield call(disconnect, wagmiConfig)
    }
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
