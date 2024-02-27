import { uploadActions } from '@audius/common/store'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'

function* handleUploadError(
  action: ReturnType<
    | typeof uploadActions.createPlaylistErrorIDExists
    | typeof uploadActions.createPlaylistErrorNoId
    | typeof uploadActions.createPlaylistPollingTimeout
  >
) {
  yield put(
    errorActions.handleError({
      message: 'error' in action ? action.error : '',
      name: action.type,
      shouldRedirect: false,
      shouldReport: true
    })
  )
}

export function* watchUploadErrors() {
  yield takeEvery(
    [
      uploadActions.COLLECTION_CREATE_PLAYLIST_NO_ID_ERROR,
      uploadActions.COLLECTION_CREATE_PLAYLIST_ID_EXISTS_ERROR,
      uploadActions.COLLECTION_POLL_PLAYLIST_TIMEOUT_ERROR
    ],
    handleUploadError
  )
}
