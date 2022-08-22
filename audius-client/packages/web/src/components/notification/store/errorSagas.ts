import {
  notificationsActions as notificationActions,
  FetchNotificationsFailed,
  FetchNotificationUsersFailed,
  ErrorLevel
} from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'

const noRedirectSet = new Set([
  // Failed to fetch notifications
  notificationActions.FETCH_NOTIFICATIONS_FAILED
])

type ErrorAction = FetchNotificationsFailed | FetchNotificationUsersFailed

function* handleFetchNotificationError(action: ErrorAction) {
  // Determine whether the error should redirect to /error and whether it should report it.
  const shouldRedirect = !noRedirectSet.has(action.type)
  let shouldReport = true
  if ('shouldReport' in action) shouldReport = !!action.shouldReport

  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect,
      shouldReport,
      additionalInfo: { errorMessage: action.message },
      level: ErrorLevel.Warning
    })
  )
}

export function* watchNotificationError() {
  yield takeEvery(
    [notificationActions.FETCH_NOTIFICATIONS_FAILED],
    handleFetchNotificationError
  )
}
