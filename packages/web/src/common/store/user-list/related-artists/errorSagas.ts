import { relatedArtistsUserListActions } from '@audius/common/store'

import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'
const { GET_RELATED_ARTISTS_ERROR, getRelatedArtistsError } =
  relatedArtistsUserListActions

type HandleRelatedArtistsError = ReturnType<typeof getRelatedArtistsError>

export function* handleRelatedArtistsError(action: HandleRelatedArtistsError) {
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

export function* watchRelatedArtistsError() {
  yield takeEvery([GET_RELATED_ARTISTS_ERROR], handleRelatedArtistsError)
}
