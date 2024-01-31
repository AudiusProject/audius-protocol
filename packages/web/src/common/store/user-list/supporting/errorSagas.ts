import { supportingUserListActions } from '@audius/common/store'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const { GET_SUPPORTING_ERROR, getSupportingError } = supportingUserListActions

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
