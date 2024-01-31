import { favoritesUserListActions } from '@audius/common/store'
import {} from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const {
  GET_TRACK_FAVORITE_ERROR,
  GET_PLAYLIST_FAVORITE_ERROR,
  trackFavoriteError,
  playlistFavoriteError
} = favoritesUserListActions

type ErrorActions =
  | ReturnType<typeof trackFavoriteError>
  | ReturnType<typeof playlistFavoriteError>

export function* handleFavoriteError(action: ErrorActions) {
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

export function* watchFavoriteError() {
  yield takeEvery(
    [GET_TRACK_FAVORITE_ERROR, GET_PLAYLIST_FAVORITE_ERROR],
    handleFavoriteError
  )
}
