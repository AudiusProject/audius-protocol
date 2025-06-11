import { TrackMetadataForUpload } from '~/store'

import { ID } from '../../../models'
export const EDIT_TRACK = 'CACHE/TRACKS/EDIT_TRACK'
export const EDIT_TRACK_SUCCEEDED = 'CACHE/TRACKS/EDIT_TRACK_SUCCEEDED'
export const EDIT_TRACK_FAILED = 'CACHE/TRACKS/EDIT_TRACK_FAILED'

export const DELETE_TRACK = 'CACHE/TRACKS/DELETE_TRACK'
export const DELETE_TRACK_SUCCEEDED = 'CACHE/TRACKS/DELETE_TRACK_SUCCEEDED'
export const DELETE_TRACK_REQUESTED = 'CACHE/TRACKS/DELETE_TRACK_REQUESTED'

export function editTrack(trackId: ID, formFields: TrackMetadataForUpload) {
  return { type: EDIT_TRACK, trackId, formFields }
}

export function editTrackSucceeded() {
  return { type: EDIT_TRACK_SUCCEEDED }
}

export function editTrackFailed() {
  return { type: EDIT_TRACK_FAILED }
}

export function deleteTrack(trackId: ID) {
  return { type: DELETE_TRACK, trackId }
}

export function deleteTrackSucceeded(trackId: ID) {
  return { type: DELETE_TRACK_SUCCEEDED, trackId }
}

export function deleteTrackRequested(trackId: ID) {
  return { type: DELETE_TRACK_REQUESTED, trackId }
}
