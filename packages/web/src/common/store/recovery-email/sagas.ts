import { Name } from '@audius/common'
import { takeLatest, put } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'
import { make } from 'store/analytics/actions'

import { resendRecoveryEmail as resendRecoveryEmailAction } from './slice'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchResendRecoveryEmail() {
  yield takeLatest(resendRecoveryEmailAction.type, function* () {
    if (NATIVE_MOBILE) {
      yield put(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
      AudiusBackend.sendRecoveryEmail()
    } else {
      yield put(
        make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {
          callback: AudiusBackend.sendRecoveryEmail
        })
      )
    }
  })
}

export default function sagas() {
  return [watchResendRecoveryEmail]
}
