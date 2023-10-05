import {
  notificationsActions,
  ErrorLevel,
  FetchNotificationsFailedAction
} from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'

const { fetchNotificationsFailed } = notificationsActions

type ErrorAction = FetchNotificationsFailedAction

function* handleFetchNotificationError(action: ErrorAction) {
  const { message, shouldReport = true } = action.payload
  // Determine whether the error should redirect to /error and whether it should report it.
  yield put(
    errorActions.handleError({
      message: action.type,
      shouldReport,
      additionalInfo: { errorMessage: message },
      level: ErrorLevel.Warning
    })
  )
}

export function* watchNotificationError() {
  yield takeEvery(fetchNotificationsFailed.type, handleFetchNotificationError)
}
