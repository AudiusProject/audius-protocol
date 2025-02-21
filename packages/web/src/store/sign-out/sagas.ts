import { Name } from '@audius/common/models'
import { TRENDING_PAGE } from '@audius/common/src/utils/route'
import {
  accountActions,
  signOutActions,
  getContext
} from '@audius/common/store'
import { disconnect } from '@wagmi/core'
import { takeLatest, put, call } from 'redux-saga/effects'

import { wagmiConfig } from 'app/AppProviders'
import { make } from 'common/store/analytics/actions'
import { signOut } from 'store/sign-out/signOut'
import { push } from 'utils/navigation'
const { resetAccount, unsubscribeBrowserPushNotifications } = accountActions
const { signOut: signOutAction } = signOutActions

function* watchSignOut() {
  const localStorage = yield* getContext('localStorage')
  const authService = yield* getContext('authService')
  yield takeLatest(
    signOutAction.type,
    function* (action: ReturnType<typeof signOutAction>) {
      if (wagmiConfig.state.status === 'connected') {
        yield call(disconnect, wagmiConfig)
      }
      yield put(resetAccount())
      yield put(unsubscribeBrowserPushNotifications())
      yield put(
        make(Name.SETTINGS_LOG_OUT, {
          callback: () => signOut(localStorage, authService)
        })
      )
      if (!action?.payload?.fromOAuth) {
        yield put(push(TRENDING_PAGE))
      }
    }
  )
}

export default function sagas() {
  return [watchSignOut]
}
