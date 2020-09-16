// Common operation types for tests.

const OPERATION_TYPE = Object.freeze({
  TRACK_UPLOAD: 'TRACK_UPLOAD'
})

function TrackUploadRequest(walletIndex, userId) {
  return {
    type: OPERATION_TYPE.TRACK_UPLOAD,
    walletIndex,
    userId
  }
}

function TrackUploadResponse(
  walletIndex,
  trackId,
  metadata,
  success = true,
  error = null
) {
  return {
    type: OPERATION_TYPE.TRACK_UPLOAD,
    walletIndex,
    trackId,
    metadata,
    success,
    error
  }
}

module.exports = {
  OPERATION_TYPE,
  TrackUploadRequest,
  TrackUploadResponse
}
