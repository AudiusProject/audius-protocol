import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import { GET_MUTUALS_ERROR, getMutualsError } from './actions'

type ErrorActions = ReturnType<typeof getMutualsError>

export function* handleMutualsError(action: ErrorActions) {
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

export function* watchMutualsError() {
  yield takeEvery([GET_MUTUALS_ERROR], handleMutualsError)
}
