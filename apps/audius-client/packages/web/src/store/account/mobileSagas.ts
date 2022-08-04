import { Nullable, User } from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { takeEvery, put, call } from 'redux-saga/effects'

import * as accountActions from 'common/store/account/reducer'
import { setNeedsAccountRecovery } from 'common/store/account/reducer'
import { updateProfileAsync } from 'pages/profile-page/sagas'
import AudiusBackend from 'services/AudiusBackend'
import { FetchAccountFailed } from 'services/native-mobile-interface/lifecycle'
import { ReloadMessage } from 'services/native-mobile-interface/linking'
import { MessageType } from 'services/native-mobile-interface/types'
import { SIGN_UP_PAGE, SIGN_IN_PAGE, doesMatchRoute } from 'utils/route'

export const RESET_REQUIRED_KEY = 'password-reset-required'
export const ENTROPY_KEY = 'hedgehog-entropy-key'
export const IS_MOBILE_USER_KEY = 'is-mobile-user'
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchFetchAccountFailed() {
  yield takeEvery(accountActions.fetchAccountFailed.type, function* () {
    // Do not push route if the user is already on the signup or signin page
    // or else it will toggle the UI page.
    if (!doesMatchRoute(SIGN_IN_PAGE) && !doesMatchRoute(SIGN_UP_PAGE)) {
      yield put(pushRoute(SIGN_UP_PAGE))
    }
    if (NATIVE_MOBILE) {
      new FetchAccountFailed().send()
    }
  })
}

function* watchAccountRecovery() {
  yield takeEvery(
    MessageType.ACCOUNT_RECOVERY,
    function* ({ login, warning, email }: any) {
      let entropy: Nullable<string> = null
      let isSameAccount = false

      if (login) {
        entropy = atob(login)
        const oldEntropy = window.localStorage.getItem(ENTROPY_KEY)
        window.localStorage.setItem(ENTROPY_KEY, entropy ?? '')
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
    }
  )
}

export function* setHasSignedInOnMobile(account: User) {
  const isMobileUser = window.localStorage.getItem(IS_MOBILE_USER_KEY)
  if (!isMobileUser || isMobileUser !== 'true') {
    try {
      // Legacy method to update whether a user has signed in on
      // native mobile. Used in identity service for notification indexing
      yield call(AudiusBackend.updateUserEvent, {
        hasSignedInNativeMobile: true
      })
      // Updates the user metadata with an event `is_mobile_user` set to true
      // if the account is being fetched from a mobile context
      yield call(updateProfileAsync, {
        metadata: { ...account, events: { is_mobile_user: true } }
      })

      window.localStorage.setItem(IS_MOBILE_USER_KEY, 'true')
    } catch (e) {
      console.error(e)
      // Do nothing. A retry on the next session will suffice.
    }
  }
}

const sagas = () => {
  return [watchFetchAccountFailed, watchAccountRecovery]
}

export default sagas
