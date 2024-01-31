import { Name } from '@audius/common/models'
import { recoveryEmailActions, getContext } from '@audius/common/store'
import { takeLatest, put, call } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'

const { resendRecoveryEmail, resendSuccess, resendError } = recoveryEmailActions

function* watchResendRecoveryEmail() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* takeLatest(resendRecoveryEmail.type, function* () {
    const response = yield* call(audiusBackendInstance.sendRecoveryEmail)
    if (response?.status) {
      yield* put(resendSuccess())
      yield* put(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
    } else {
      yield* put(resendError())
    }
  })
}

export default function sagas() {
  return [watchResendRecoveryEmail]
}
