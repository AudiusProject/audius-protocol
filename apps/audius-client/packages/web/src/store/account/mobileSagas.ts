import { takeEvery, put } from 'redux-saga/effects'
import * as accountActions from 'store/account/reducer'
import { push as pushRoute } from 'connected-react-router'
import { SIGN_UP_PAGE, SIGN_IN_PAGE, doesMatchRoute } from 'utils/route'
import { MessageType } from 'services/native-mobile-interface/types'
import { setNeedsAccountRecovery } from './reducer'
import { ReloadMessage } from 'services/native-mobile-interface/linking'

export const RESET_REQUIRED_KEY = 'password-reset-required'
export const ENTROPY_KEY = 'hedgehog-entropy-key'

function* watchFetchAccountFailed() {
  yield takeEvery(accountActions.fetchAccountFailed.type, function* () {
    // Do not push route if the user is already on the signup or signin page
    // or else it will toggle the UI page.
    if (!doesMatchRoute(SIGN_IN_PAGE) && !doesMatchRoute(SIGN_UP_PAGE)) {
      yield put(pushRoute(SIGN_UP_PAGE))
    }
  })
}

function* watchAccountRecovery() {
  yield takeEvery(MessageType.ACCOUNT_RECOVERY, function* ({
    login,
    warning,
    email
  }: any) {
    let entropy = null
    let isSameAccount = false

    if (login) {
      entropy = atob(login)
      const oldEntropy = window.localStorage.getItem(ENTROPY_KEY)
      window.localStorage.setItem(ENTROPY_KEY, entropy)
      isSameAccount = oldEntropy === entropy
    }

    if (warning === 'RECOVERY_DO_NOT_SHARE' && email) {
      window.localStorage.setItem(RESET_REQUIRED_KEY, email)
    }

    // If it's not the same account,
    // reload webview to reload libs
    // with the new entropy
    if (!isSameAccount) {
      new ReloadMessage().send()
    } else {
      yield put(setNeedsAccountRecovery())
    }
  })
}

const sagas = () => {
  return [watchFetchAccountFailed, watchAccountRecovery]
}

export default sagas
