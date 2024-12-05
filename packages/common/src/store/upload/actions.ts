import { NativeFile } from '@audius/sdk'

import { CollectionValues } from '~/schemas'

import { Collection, ID, Track } from '../../models'

import {
  Progress,
  TrackForUpload,
  TrackMetadataForUpload,
  UploadType
} from './types'

export const UPLOAD_TRACKS = 'UPLOAD/UPLOAD_TRACKS'
export const UPLOAD_TRACKS_REQUESTED = 'UPLOAD/UPLOAD_TRACKS_REQUESTED'
export const UPLOAD_TRACKS_SUCCEEDED = 'UPLOAD/UPLOAD_TRACKS_SUCCEEDED'
export const UPLOAD_TRACKS_FAILED = 'UPLOAD/UPLOAD_TRACKS_FAILED'
export const UPLOAD_SINGLE_TRACK_FAILED = 'UPLOAD/UPLOAD_SINGLE_TRACK_FAILED'

export const UPDATE_TRACK_AUDIO = 'UPLOAD/UPDATE_TRACK_AUDIO'

export const UPDATE_PERCENT = 'UPLOAD/UPDATE_PERCENT'
export const INCREMENT_PERCENT = 'UPLOAD/INCREMENT_PERCENT'
export const UPDATE_PROGRESS = 'UPLOAD/UPDATE_PROGRESS'
export const RESET = 'UPLOAD/RESET'
export const RESET_STATE = 'UPLOAD/RESET_STATE'
export const UNDO_RESET_STATE = 'UPLOAD/UNDO_RESET_STATE'
export const TOGGLE_MULTI_TRACK_NOTIFICATION =
  'UPLOAD/TOGGLE_MULTI_TRACK_NOTIFICATION'

type UploadPayload =
  | {
      uploadType: UploadType.INDIVIDUAL_TRACK | UploadType.INDIVIDUAL_TRACKS
      tracks: TrackForUpload[]
    }
  | {
      uploadType: UploadType.ALBUM | UploadType.PLAYLIST
      tracks: TrackForUpload[]
      metadata: CollectionValues
    }

export const uploadTracks = (payload: UploadPayload) => {
  return { type: UPLOAD_TRACKS, payload }
}

export const uploadSingleTrackFailed = (index: number) => {
  return { type: UPLOAD_SINGLE_TRACK_FAILED, index }
}

export const uploadTracksRequested = (payload: UploadPayload) => {
  return {
    type: UPLOAD_TRACKS_REQUESTED,
    payload
  }
}

export const uploadTracksSucceeded = ({
  id,
  trackMetadatas,
  completedEntity,
  uploadType
}: {
  id: number | null
  trackMetadatas: Partial<Track>[]
  completedEntity: Track | Collection
  uploadType: UploadType
}) => {
  return {
    type: UPLOAD_TRACKS_SUCCEEDED,
    id: id ?? null,
    trackMetadatas,
    completedEntity,
    uploadType
  }
}

export const uploadTracksFailed = () => {
  return { type: UPLOAD_TRACKS_FAILED }
}

export const updateProgress = (payload: {
  trackIndex: number
  stemIndex: number | null
  key: 'audio' | 'art'
  progress: Progress
}) => {
  return { type: UPDATE_PROGRESS, payload }
}

// Action for replacing track audio
export const updateTrackAudio = (payload: {
  trackId: ID
  file: File | NativeFile
  metadata?: TrackMetadataForUpload
}) => {
  return {
    type: UPDATE_TRACK_AUDIO,
    payload
  }
}

// Actions used to reset the react state and then the store state of upload from external container

export const reset = () => {
  return { type: RESET }
}

export const resetState = () => {
  return { type: RESET_STATE }
}
export const undoResetState = () => {
  return { type: UNDO_RESET_STATE }
}

export const toggleMultiTrackNotification = (open = false) => {
  return { type: TOGGLE_MULTI_TRACK_NOTIFICATION, open }
}
