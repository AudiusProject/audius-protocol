import { call, put, takeEvery } from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import AudiusBackend from 'services/AudiusBackend'
import { make, TrackEvent } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'

import {
  confirmCredentials,
  confirmCredentialsSucceeded,
  confirmCredentialsFailed,
  changePassword,
  changePasswordSucceeded,
  changePasswordFailed
} from './slice'

function* handleConfirmCredentials(
  action: ReturnType<typeof confirmCredentials>
) {
  yield call(waitForBackendSetup)
  try {
    const confirmed: boolean = yield call(
      AudiusBackend.confirmCredentials,
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
  yield call(waitForBackendSetup)
  try {
    yield call(
      AudiusBackend.changePassword,
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
