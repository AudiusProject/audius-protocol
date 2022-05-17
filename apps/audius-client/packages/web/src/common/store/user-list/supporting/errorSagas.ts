import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import { GET_SUPPORTING_ERROR, getSupportingError } from './actions'

type ErrorActions = ReturnType<typeof getSupportingError>

export function* handleSupportingError(action: ErrorActions) {
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

export function* watchSupportingError() {
  yield takeEvery([GET_SUPPORTING_ERROR], handleSupportingError)
}
