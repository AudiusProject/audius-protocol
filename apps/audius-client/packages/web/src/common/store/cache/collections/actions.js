export const CREATE_PLAYLIST = 'CREATE_PLAYLIST'
export const CREATE_PLAYLIST_REQUESTED = 'CREATE_PLAYLIST_REQUESTED'
export const CREATE_PLAYLIST_SUCCEEDED = 'CREATE_PLAYLIST_SUCCEEDED'
export const CREATE_PLAYLIST_FAILED = 'CREATE_PLAYLIST_FAILED'

export const EDIT_PLAYLIST = 'EDIT_PLAYLIST'
export const EDIT_PLAYLIST_SUCCEEDED = 'EDIT_PLAYLIST_SUCCEEDED'
export const EDIT_PLAYLIST_FAILED = 'EDIT_PLAYLIST_FAILED'

export const ADD_TRACK_TO_PLAYLIST = 'ADD_TRACK_TO_PLAYLIST'
export const ADD_TRACK_TO_PLAYLIST_FAILED = 'ADD_TRACK_TO_PLAYLIST_FAILED'

export const REMOVE_TRACK_FROM_PLAYLIST = 'REMOVE_TRACK_FROM_PLAYLIST'
export const REMOVE_TRACK_FROM_PLAYLIST_FAILED =
  'REMOVE_TRACK_FROM_PLAYLIST_FAILED'

export const ORDER_PLAYLIST = 'ORDER_PLAYLIST'
export const ORDER_PLAYLIST_FAILED = 'ORDER_PLAYLIST_FAILED'

export const PUBLISH_PLAYLIST = 'PUBLISH_PLAYLIST'
export const PUBLISH_PLAYLIST_FAILED = 'PUBLISH_PLAYLIST_FAILED'

export const DELETE_PLAYLIST = 'DELETE_PLAYLIST'
export const DELETE_PLAYLIST_REQUESTED = 'DELETE_PLAYLIST_REQUESTED'
export const DELETE_PLAYLIST_SUCCEEDED = 'DELETE_PLAYLIST_SUCCEEDED'
export const DELETE_PLAYLIST_FAILED = 'DELETE_PLAYLIST_FAILED'

export const FETCH_COVER_ART = 'TRACKS/FETCH_COVER_ART'

/**
 * @param {integer} tempId
 * @param {object} formFields
 * @param {?integer} initTrackId optional track id to pull artwork from.
 */
export function createPlaylist(
  tempId,
  formFields,
  source,
  initTrackId = undefined
) {
  return { type: CREATE_PLAYLIST, tempId, formFields, source, initTrackId }
}

export function createPlaylistRequested() {
  return { type: CREATE_PLAYLIST_REQUESTED }
}

export function createPlaylistSucceeded() {
  return { type: CREATE_PLAYLIST_SUCCEEDED }
}

export function createPlaylistFailed(error, params, metadata) {
  return { type: CREATE_PLAYLIST_FAILED, error, params, metadata }
}

export function editPlaylist(playlistId, formFields) {
  return { type: EDIT_PLAYLIST, playlistId, formFields }
}

export function editPlaylistSucceeded() {
  return { type: EDIT_PLAYLIST_SUCCEEDED }
}

export function editPlaylistFailed(error, params, metadata) {
  return { type: EDIT_PLAYLIST_FAILED, error, params, metadata }
}

export function addTrackToPlaylist(trackId, playlistId) {
  return { type: ADD_TRACK_TO_PLAYLIST, trackId, playlistId }
}

export function addTrackToPlaylistFailed(error, params, metadata) {
  return { type: ADD_TRACK_TO_PLAYLIST_FAILED, error, params, metadata }
}

export function removeTrackFromPlaylist(trackId, playlistId, timestamp) {
  return { type: REMOVE_TRACK_FROM_PLAYLIST, trackId, playlistId, timestamp }
}

export function removeTrackFromPlaylistFailed(error, params, metadata) {
  return { type: REMOVE_TRACK_FROM_PLAYLIST_FAILED, error, params, metadata }
}

export function orderPlaylist(playlistId, trackIdsAndTimes, trackUids) {
  return { type: ORDER_PLAYLIST, playlistId, trackIdsAndTimes, trackUids }
}

export function orderPlaylistFailed(error, params, metadata) {
  return { type: ORDER_PLAYLIST_FAILED, error, params, metadata }
}

export function publishPlaylist(playlistId) {
  return { type: PUBLISH_PLAYLIST, playlistId }
}

export function publishPlaylistFailed(error, params, metadata) {
  return { type: PUBLISH_PLAYLIST_FAILED, error, params, metadata }
}

export function deletePlaylist(playlistId) {
  return { type: DELETE_PLAYLIST, playlistId }
}

export function deletePlaylistRequested() {
  return { type: DELETE_PLAYLIST_REQUESTED }
}

export function deletePlaylistSucceeded() {
  return { type: DELETE_PLAYLIST_SUCCEEDED }
}

export function deletePlaylistFailed(error, params, metadata) {
  return { type: DELETE_PLAYLIST_FAILED, error, params, metadata }
}

export function fetchCoverArt(collectionId, size) {
  return { type: FETCH_COVER_ART, collectionId, size }
}
