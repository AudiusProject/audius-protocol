import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import { GET_TOP_SUPPORTERS_ERROR, getTopSupportersError } from './actions'

type handleTopSupportersError = ReturnType<typeof getTopSupportersError>

export function* handleFollowersError(action: handleTopSupportersError) {
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

export function* watchTopSupportersError() {
  yield takeEvery([GET_TOP_SUPPORTERS_ERROR], handleFollowersError)
}
