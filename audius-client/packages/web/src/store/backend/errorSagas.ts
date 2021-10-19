import { takeEvery, put } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'
import * as backendActions from 'store/backend/actions'

function* handleError(action: any) {
  console.error(`Got setup err: ${JSON.stringify(action)}`)
  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect: true,
      shouldReport: true,
      additionalInfo: { error: action.error }
    })
  )
}

export function* watchBackendErrors() {
  yield takeEvery(backendActions.LIBS_ERROR, handleError)
}
