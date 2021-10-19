import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import { GET_FOLLOWING_ERROR, getFollowersError } from './actions'

type ErrorActions = ReturnType<typeof getFollowersError>

export function* handleFollowersError(action: ErrorActions) {
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

export function* watchFollowersError() {
  yield takeEvery([GET_FOLLOWING_ERROR], handleFollowersError)
}
