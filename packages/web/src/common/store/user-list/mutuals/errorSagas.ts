import { mutualsUserListActions } from '@audius/common/store'
import {} from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const { GET_MUTUALS_ERROR, getMutualsError } = mutualsUserListActions

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
