import { CollectionValues } from '~/schemas'

import { Collection, Track } from '../../models'

import { Progress, UploadTrack, UploadType } from './types'

export const UPLOAD_TRACKS = 'UPLOAD/UPLOAD_TRACKS'
export const UPLOAD_TRACKS_REQUESTED = 'UPLOAD/UPLOAD_TRACKS_REQUESTED'
export const UPLOAD_TRACKS_SUCCEEDED = 'UPLOAD/UPLOAD_TRACKS_SUCCEEDED'
export const UPLOAD_TRACKS_FAILED = 'UPLOAD/UPLOAD_TRACKS_FAILED'
export const UPLOAD_SINGLE_TRACK_FAILED = 'UPLOAD/UPLOAD_SINGLE_TRACK_FAILED'

export const UPDATE_PERCENT = 'UPLOAD/UPDATE_PERCENT'
export const INCREMENT_PERCENT = 'UPLOAD/INCREMENT_PERCENT'
export const UPDATE_PROGRESS = 'UPLOAD/UPDATE_PROGRESS'
export const RESET = 'UPLOAD/RESET'
export const RESET_STATE = 'UPLOAD/RESET_STATE'
export const UNDO_RESET_STATE = 'UPLOAD/UNDO_RESET_STATE'
export const TOGGLE_MULTI_TRACK_NOTIFICATION =
  'UPLOAD/TOGGLE_MULTI_TRACK_NOTIFICATION'

// Errors
export const SINGLE_TRACK_UPLOAD_ERROR = 'UPLOAD/ERROR/SINGLE_TRACK_UPLOAD'
export const SINGLE_TRACK_UPLOAD_TIMEOUT_ERROR =
  'UPLOAD/ERROR/SINGLE_TRACK_UPLOAD_TIMEOUT'
export const MULTI_TRACK_UPLOAD_ERROR = 'UPLOAD/ERROR/MULTI_TRACK_UPLOAD'
export const MULTI_TRACK_TIMEOUT_ERROR = 'UPLOAD/ERROR/MULTI_TRACK_TIMEOUT'
export const COLLECTION_CREATOR_NODE_UPLOAD_ERROR =
  'UPLOAD/ERROR/COLLECTION_CREATOR_NODE_UPLOAD'
export const COLLECTION_CREATOR_NODE_TIMEOUT_ERROR =
  'UPLOAD/ERROR/COLLECTION_CREATOR_NODE_TIMEOU'
export const COLLECTION_ADD_TRACK_TO_CHAIN_ERROR =
  'UPLOAD/ERROR/COLLECTION_ADD_TRACK_TO_CHAIN'
export const COLLECTION_ASSOCIATE_TRACKS_ERROR =
  'UPLOAD/ERROR/COLLECTION_ASSOCIATE_TRACKS'
export const COLLECTION_CREATE_PLAYLIST_NO_ID_ERROR =
  'UPLOAD/ERROR/COLLECTION_CREATE_PLAYLIST_NO_ID'
export const COLLECTION_CREATE_PLAYLIST_ID_EXISTS_ERROR =
  'UPLOAD/ERROR/COLLECTION_CREATE_PLAYLIST_ID_EXISTS'
export const COLLECTION_POLL_PLAYLIST_TIMEOUT_ERROR =
  'UPLOAD/ERROR/COLLECTION_POLL_PLAYLIST_TIMEOUT'

type UploadPayload =
  | {
      uploadType: UploadType.INDIVIDUAL_TRACK | UploadType.INDIVIDUAL_TRACKS
      tracks: UploadTrack[]
    }
  | {
      uploadType: UploadType.ALBUM | UploadType.PLAYLIST
      tracks: UploadTrack[]
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

export const uploadTracksSucceeded = (
  id: number | null,
  trackMetadatas: Partial<Track>[],
  completedEntity: Track | Collection
) => {
  return {
    type: UPLOAD_TRACKS_SUCCEEDED,
    id: id ?? null,
    trackMetadatas,
    completedEntity
  }
}

export const uploadTrackFailed = () => {
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

// Actions used to reset the react state and then the store state of upload from external container
export const resetState = () => {
  return { type: RESET_STATE }
}
export const undoResetState = () => {
  return { type: UNDO_RESET_STATE }
}

export const toggleMultiTrackNotification = (open = false) => {
  return { type: TOGGLE_MULTI_TRACK_NOTIFICATION, open }
}

export const singleTrackUploadError = (
  error: string,
  phase?: string,
  trackSizeBytes?: number
) => ({
  type: SINGLE_TRACK_UPLOAD_ERROR,
  trackSizeBytes,
  error,
  phase
})

export const singleTrackTimeoutError = () => ({
  type: SINGLE_TRACK_UPLOAD_TIMEOUT_ERROR
})

export const multiTrackUploadError = (
  error: string,
  phase?: string,
  numTracks?: number,
  isStem?: boolean
) => ({
  type: MULTI_TRACK_UPLOAD_ERROR,
  error,
  phase,
  numTracks,
  isStem
})

export const multiTrackTimeoutError = () => ({
  type: MULTI_TRACK_TIMEOUT_ERROR
})

export const creatorNodeUploadError = (error: string) => ({
  type: COLLECTION_CREATOR_NODE_UPLOAD_ERROR,
  error
})

export const creatorNodeTimeoutError = () => ({
  type: COLLECTION_CREATOR_NODE_TIMEOUT_ERROR
})

export const addTrackToChainError = (error: string) => ({
  type: COLLECTION_ADD_TRACK_TO_CHAIN_ERROR,
  error
})

export const associateTracksError = (error: string) => ({
  type: COLLECTION_ASSOCIATE_TRACKS_ERROR,
  error
})

export const createPlaylistErrorIDExists = (error: string) => ({
  type: COLLECTION_CREATE_PLAYLIST_ID_EXISTS_ERROR,
  error
})

export const createPlaylistErrorNoId = (error: string) => ({
  type: COLLECTION_CREATE_PLAYLIST_NO_ID_ERROR,
  error
})

export const createPlaylistPollingTimeout = () => ({
  type: COLLECTION_POLL_PLAYLIST_TIMEOUT_ERROR
})
