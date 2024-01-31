import { followingUserListActions } from '@audius/common/store'
import {} from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const { GET_FOLLOWING_ERROR, getFollowingError } = followingUserListActions

type ErrorActions = ReturnType<typeof getFollowingError>

export function* handleFollowingError(action: ErrorActions) {
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

export function* watchFollowingError() {
  yield takeEvery([GET_FOLLOWING_ERROR], handleFollowingError)
}
