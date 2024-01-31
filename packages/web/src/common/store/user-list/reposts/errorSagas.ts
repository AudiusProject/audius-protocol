import { repostsUserListActions } from '@audius/common/store'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const {
  GET_TRACK_REPOST_ERROR,
  GET_PLAYLIST_REPOST_ERROR,
  trackRepostError,
  playlistRepostError
} = repostsUserListActions

type ErrorActions =
  | ReturnType<typeof trackRepostError>
  | ReturnType<typeof playlistRepostError>

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
  yield takeEvery(
    [GET_TRACK_REPOST_ERROR, GET_PLAYLIST_REPOST_ERROR],
    handleRepostError
  )
}
