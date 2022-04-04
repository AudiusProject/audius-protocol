// Common operation types for tests.

const OPERATION_TYPE = Object.freeze({
  TRACK_UPLOAD: 'TRACK_UPLOAD',
  TRACK_REPOST: 'TRACK_REPOST',
  ADD_PLAYLIST_TRACK: 'ADD_PLAYLIST_TRACK',
  CREATE_PLAYLIST: 'CREATE_PLAYLIST'
})

function TrackUploadRequest (walletIndex, userId) {
  return {
    type: OPERATION_TYPE.TRACK_UPLOAD,
    walletIndex,
    userId
  }
}

function TrackUploadResponse (
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

function TrackRepostRequest (walletIndex, userId) {
  return {
    type: OPERATION_TYPE.TRACK_REPOST,
    walletIndex,
    userId
  }
}

function TrackRepostResponse (
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

function AddPlaylistTrackRequest (walletIndex, userId) {
  return {
    type: OPERATION_TYPE.ADD_PLAYLIST_TRACK,
    walletIndex,
    userId
  }
}

function AddPlaylistTrackResponse (
  walletIndex,
  trackId,
  success = true,
  error = null
) {
  return {
    type: OPERATION_TYPE.ADD_PLAYLIST_TRACK,
    walletIndex,
    trackId,
    success,
    error
  }
}

function CreatePlaylistRequest (walletIndex, userId) {
  return {
    type: OPERATION_TYPE.CREATE_PLAYLIST,
    walletIndex,
    userId
  }
}

function CreatePlaylistResponse (
  walletIndex,
  playlist,
  userId,
  success = true,
  error = null
) {
  return {
    type: OPERATION_TYPE.CREATE_PLAYLIST,
    walletIndex,
    playlist,
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
  TrackRepostResponse,
  AddPlaylistTrackRequest,
  AddPlaylistTrackResponse,
  CreatePlaylistRequest,
  CreatePlaylistResponse
}
