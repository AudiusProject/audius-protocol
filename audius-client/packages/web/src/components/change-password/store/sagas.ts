import { Name } from '@audius/common'
import { call, put, takeEvery } from 'redux-saga/effects'

import { getContext } from 'common/store'
import { waitForBackendSetup } from 'common/store/backend/sagas'
import {
  confirmCredentials,
  confirmCredentialsSucceeded,
  confirmCredentialsFailed,
  changePassword,
  changePasswordSucceeded,
  changePasswordFailed
} from 'common/store/change-password/slice'
import { make, TrackEvent } from 'store/analytics/actions'

function* handleConfirmCredentials(
  action: ReturnType<typeof confirmCredentials>
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield call(waitForBackendSetup)
  try {
    const confirmed: boolean = yield call(
      audiusBackendInstance.confirmCredentials,
      action.payload.email,
      action.payload.password
    )
    if (!confirmed) {
      throw new Error('Invalid credentials')
    }
    yield put(confirmCredentialsSucceeded())
  } catch {
    yield put(confirmCredentialsFailed())
  }
}

function* handleChangePassword(action: ReturnType<typeof changePassword>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield call(waitForBackendSetup)
  try {
    yield call(
      audiusBackendInstance.changePassword,
      action.payload.email,
      action.payload.password,
      action.payload.oldPassword
    )
    yield put(changePasswordSucceeded())
    const trackEvent: TrackEvent = make(
      Name.SETTINGS_COMPLETE_CHANGE_PASSWORD,
      {
        status: 'success'
      }
    )
    yield put(trackEvent)
  } catch {
    yield put(changePasswordFailed())
    const trackEvent: TrackEvent = make(
      Name.SETTINGS_COMPLETE_CHANGE_PASSWORD,
      {
        status: 'failure'
      }
    )
    yield put(trackEvent)
  }
}

function* watchConfirmCredentials() {
  yield takeEvery(confirmCredentials, handleConfirmCredentials)
}

function* watchChangePassword() {
  yield takeEvery(changePassword, handleChangePassword)
}

export default function sagas() {
  return [watchConfirmCredentials, watchChangePassword]
}
