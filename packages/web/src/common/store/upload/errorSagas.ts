import { uploadActions } from '@audius/common/store'
import {} from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'

const BYTES_PER_MB = 1000 * 1000

const errorsWithoutRedirect = new Set([
  // Multitrack shouldn't redirect b/c
  // some tracks are better than none
  uploadActions.MULTI_TRACK_TIMEOUT_ERROR,
  uploadActions.MULTI_TRACK_UPLOAD_ERROR,

  // Associate requires track cleanup
  uploadActions.COLLECTION_ASSOCIATE_TRACKS_ERROR,

  // Playlist errors require
  // track & possibly playlist cleanup
  uploadActions.COLLECTION_CREATE_PLAYLIST_ID_EXISTS_ERROR,
  uploadActions.COLLECTION_CREATE_PLAYLIST_NO_ID_ERROR,
  uploadActions.COLLECTION_POLL_PLAYLIST_TIMEOUT_ERROR
])

// TODO: This definition should live in Upload Actions
// once we've settled on a pattern for defining actions in TS
type UploadErrorActions = {
  type: string
  error: string
  trackSizeBytes?: number
  phase?: string
  numTracks?: number
  isStem?: boolean
}

function* handleUploadError(action: UploadErrorActions) {
  const shouldRedirect = !errorsWithoutRedirect.has(action.type)

  // Append extra info depending on the action type
  const extras: {
    error?: string
    fileSize?: string
    phase?: string
    numTracks?: number
    isStem?: boolean
  } = { error: action.error }
  switch (action.type) {
    case uploadActions.SINGLE_TRACK_UPLOAD_ERROR:
      extras.fileSize = `${action.trackSizeBytes! / BYTES_PER_MB} mb`
      extras.phase = action.phase!
      break
    case uploadActions.MULTI_TRACK_UPLOAD_ERROR:
      extras.phase = action.phase!
      extras.numTracks = action.numTracks!
      extras.isStem = action.isStem!
      break
    default:
  }

  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect,
      shouldReport: true,
      additionalInfo: extras
    })
  )
}

export function* watchUploadErrors() {
  yield takeEvery(
    [
      uploadActions.SINGLE_TRACK_UPLOAD_ERROR,
      uploadActions.SINGLE_TRACK_UPLOAD_TIMEOUT_ERROR,
      uploadActions.MULTI_TRACK_UPLOAD_ERROR,
      uploadActions.MULTI_TRACK_TIMEOUT_ERROR,
      uploadActions.COLLECTION_CREATOR_NODE_UPLOAD_ERROR,
      uploadActions.COLLECTION_CREATOR_NODE_TIMEOUT_ERROR,
      uploadActions.COLLECTION_ADD_TRACK_TO_CHAIN_ERROR,
      uploadActions.COLLECTION_ASSOCIATE_TRACKS_ERROR,
      uploadActions.COLLECTION_CREATE_PLAYLIST_NO_ID_ERROR,
      uploadActions.COLLECTION_CREATE_PLAYLIST_ID_EXISTS_ERROR,
      uploadActions.COLLECTION_POLL_PLAYLIST_TIMEOUT_ERROR
    ],
    handleUploadError
  )
}
