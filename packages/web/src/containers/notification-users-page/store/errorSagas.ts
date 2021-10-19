import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import { GET_NOTIFICATION_ERROR, getNotificationError } from './actions'

type ErrorActions = ReturnType<typeof getNotificationError>

export function* handleRepostError(action: ErrorActions) {
  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect: true,
      shouldReport: true,
      additionalInfo: {
        errorMessage: action.error,
        id: action.id
      }
    })
  )
}

export function* watchRepostsError() {
  yield takeEvery([GET_NOTIFICATION_ERROR], handleRepostError)
}
