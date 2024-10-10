import { remixersUserListActions } from '@audius/common/store'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const { GET_REMIXERS_ERROR, getRemixersError } = remixersUserListActions

type HandleRemixersError = ReturnType<typeof getRemixersError>

export function* handleRemixersError(action: HandleRemixersError) {
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

export function* watchRemixersError() {
  yield takeEvery([GET_REMIXERS_ERROR], handleRemixersError)
}
