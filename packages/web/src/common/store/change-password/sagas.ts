import { Name } from '@audius/common/models'
import { changePasswordActions, getContext } from '@audius/common/store'
import { call, put, takeEvery } from 'typed-redux-saga'

import { make, TrackEvent } from 'common/store/analytics/actions'

const {
  confirmCredentials,
  confirmCredentialsSucceeded,
  confirmCredentialsFailed,
  changePassword,
  changePasswordSucceeded,
  changePasswordFailed
} = changePasswordActions

function* handleConfirmCredentials(
  action: ReturnType<typeof confirmCredentials>
) {
  const { email, password } = action.payload
  const authService = yield* getContext('authService')
  try {
    const confirmed = yield* call(
      [authService, authService.confirmCredentials],
      {
        username: email,
        password
      }
    )
    if (!confirmed) {
      yield* put(confirmCredentialsFailed())
    } else {
      yield* put(confirmCredentialsSucceeded())
    }
  } catch {
    yield* put(confirmCredentialsFailed())
  }
}

function* handleChangePassword(action: ReturnType<typeof changePassword>) {
  const { email, password, oldPassword } = action.payload
  const authService = yield* getContext('authService')
  try {
    yield* call([authService, authService.changeCredentials], {
      newUsername: email,
      newPassword: password,
      oldUsername: email,
      oldPassword
    })
    yield* put(changePasswordSucceeded())
    const trackEvent: TrackEvent = make(
      Name.SETTINGS_COMPLETE_CHANGE_PASSWORD,
      {
        status: 'success'
      }
    )
    yield* put(trackEvent)
  } catch {
    yield* put(changePasswordFailed())
    const trackEvent: TrackEvent = make(
      Name.SETTINGS_COMPLETE_CHANGE_PASSWORD,
      {
        status: 'failure'
      }
    )
    yield* put(trackEvent)
  }
}

function* watchConfirmCredentials() {
  yield* takeEvery(confirmCredentials, handleConfirmCredentials)
}

function* watchChangePassword() {
  yield* takeEvery(changePassword, handleChangePassword)
}

export default function sagas() {
  return [watchConfirmCredentials, watchChangePassword]
}
