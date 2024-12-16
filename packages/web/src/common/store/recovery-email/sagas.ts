import { Name } from '@audius/common/models'
import {
  recoveryEmailActions,
  getContext,
  accountSelectors
} from '@audius/common/store'
import { takeLatest, put, call, select } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'

const { resendRecoveryEmail, resendSuccess, resendError } = recoveryEmailActions

function* watchResendRecoveryEmail() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* takeLatest(resendRecoveryEmail.type, function* () {
    const handle = yield* select(accountSelectors.getUserHandle)
    if (!handle) return

    const response = yield* call(
      audiusBackendInstance.sendRecoveryEmail,
      handle
    )
    try {
      if (response?.status) {
        yield* put(resendSuccess())
        yield* put(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
      } else {
        yield* put(resendError())
      }
    } catch (err) {
      const reportToSentry = yield* getContext('reportToSentry')
      reportToSentry({
        error: err instanceof Error ? err : new Error(err as string),
        name: 'Resend Recovery: Failed to send recovery email',
        additionalInfo: { handle }
      })
      yield* put(resendError())
    }
  })
}

export default function sagas() {
  return [watchResendRecoveryEmail]
}
