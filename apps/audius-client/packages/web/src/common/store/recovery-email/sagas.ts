import { Name } from '@audius/common'
import { takeLatest, put } from 'typed-redux-saga'

import { make } from 'store/analytics/actions'

import { getContext } from '../effects'

import { resendRecoveryEmail as resendRecoveryEmailAction } from './slice'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchResendRecoveryEmail() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* takeLatest(resendRecoveryEmailAction.type, function* () {
    if (NATIVE_MOBILE) {
      yield* put(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
      audiusBackendInstance.sendRecoveryEmail()
    } else {
      yield* put(
        make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {
          callback: audiusBackendInstance.sendRecoveryEmail
        })
      )
    }
  })
}

export default function sagas() {
  return [watchResendRecoveryEmail]
}
