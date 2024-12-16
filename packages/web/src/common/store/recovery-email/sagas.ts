import { Name } from '@audius/common/models'
import {
  recoveryEmailActions,
  getContext,
  accountSelectors
} from '@audius/common/store'
import { takeLatest, put, call, select } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'

const { resendRecoveryEmail, resendSuccess, resendError } = recoveryEmailActions

export function* sendRecoveryEmail() {
  const authService = yield* getContext('authService')
  const identityService = yield* getContext('identityService')
  const getHostUrl = yield* getContext('getHostUrl')
  const host = getHostUrl()
  const recoveryInfo = yield* call([
    authService.hedgehogInstance,
    authService.hedgehogInstance.generateRecoveryInfo
  ])

  const recoveryData = {
    login: recoveryInfo.login,
    host: host ?? recoveryInfo.host
  }
  yield* call([identityService, identityService.sendRecoveryInfo], recoveryData)
}

function* watchResendRecoveryEmail() {
  yield* takeLatest(resendRecoveryEmail.type, function* () {
    const handle = yield* select(accountSelectors.getUserHandle)
    if (!handle) return

    try {
      yield* call(sendRecoveryEmail)
      yield* put(resendSuccess())
      yield* put(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
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
