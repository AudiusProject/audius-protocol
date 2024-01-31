import {
  notificationsActions,
  FetchNotificationsFailedAction
} from '@audius/common/store'
import {} from '@audius/common'
import { ErrorLevel } from '@audius/common/models'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'

const { fetchNotificationsFailed } = notificationsActions

const noRedirectSet = new Set([
  // Failed to fetch notifications
  fetchNotificationsFailed.type
])

type ErrorAction = FetchNotificationsFailedAction

function* handleFetchNotificationError(action: ErrorAction) {
  const { message, shouldReport = true } = action.payload
  // Determine whether the error should redirect to /error and whether it should report it.
  const shouldRedirect = !noRedirectSet.has(action.type)

  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect,
      shouldReport,
      additionalInfo: { errorMessage: message },
      level: ErrorLevel.Warning
    })
  )
}

export function* watchNotificationError() {
  yield takeEvery(fetchNotificationsFailed.type, handleFetchNotificationError)
}
