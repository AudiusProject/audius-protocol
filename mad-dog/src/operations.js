// Common operation types for tests.

const OPERATION_TYPE = Object.freeze({
  TRACK_UPLOAD: 'TRACK_UPLOAD',
  TRACK_REPOST: 'TRACK_REPOST'
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

function TrackRepostRequest(walletIndex, userId) {
  return {
    type: OPERATION_TYPE.TRACK_REPOST,
    walletIndex,
    userId
  }
}

function TrackRepostResponse(
  walletIndex,
  trackId,
  userId,
  success = true,
  error = null
) {
  return {
    type: OPERATION_TYPE.TRACK_REPOST,
    walletIndex,
    trackId,
    userId,
    success,
    error
  }
}

module.exports = {
  OPERATION_TYPE,
  TrackUploadRequest,
  TrackUploadResponse,
  TrackRepostRequest,
  TrackRepostResponse
}
