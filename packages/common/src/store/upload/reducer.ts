import { cloneDeep } from 'lodash'

import {
  TOGGLE_MULTI_TRACK_NOTIFICATION,
  UPLOAD_TRACKS_REQUESTED,
  UPLOAD_TRACKS_SUCCEEDED,
  UPLOAD_TRACKS_FAILED,
  UPLOAD_SINGLE_TRACK_FAILED,
  UPDATE_PROGRESS,
  RESET,
  RESET_STATE,
  UNDO_RESET_STATE,
  uploadTracksRequested,
  uploadTracksSucceeded,
  updateProgress,
  uploadSingleTrackFailed
} from './actions'
import { ProgressStatus, UploadState } from './types'

const initialState: UploadState = {
  openMultiTrackNotification: true,
  tracks: null,
  metadata: null,
  uploadType: null,
  stems: [],
  uploading: false,
  uploadProgress: null,
  success: false,
  shouldReset: false,

  // For multitrack upload, we allow some tracks to
  // fail without aborting the whole thing
  failedTrackIndices: [],

  // Id to take the user to after completing upload.
  // Can be either a track or playlist/album.
  completionId: null,
  error: false
}

const initialUploadState = {
  art: {
    status: ProgressStatus.UPLOADING,
    loaded: 0,
    total: 0,
    transcode: 0
  },
  audio: {
    status: ProgressStatus.UPLOADING,
    loaded: 0,
    total: 0,
    transcode: 0
  }
}

const actionsMap = {
  [TOGGLE_MULTI_TRACK_NOTIFICATION](
    state: UploadState,
    action: { open: boolean }
  ) {
    return {
      ...state,
      openMultiTrackNotification: action.open
    }
  },
  [UPLOAD_TRACKS_REQUESTED](
    state: UploadState,
    action: ReturnType<typeof uploadTracksRequested>
  ) {
    const newState = { ...state }
    newState.uploading = true
    newState.tracks = action.tracks
    newState.uploadProgress = action.tracks
      .map(() => cloneDeep(initialUploadState))
      .concat(
        action.stems
          ?.map((t) => t.map(() => cloneDeep(initialUploadState)))
          .flat(1) ?? []
      )
    newState.metadata = action.metadata ?? null
    newState.uploadType = action.uploadType ?? null
    newState.stems = action.stems ?? newState.stems
    return newState
  },
  [UPLOAD_TRACKS_SUCCEEDED](
    state: UploadState,
    action: ReturnType<typeof uploadTracksSucceeded>
  ) {
    const { id, trackMetadatas } = action
    const newState = { ...state }
    newState.uploading = false
    newState.success = true
    newState.completionId = id
    newState.uploadType = null
    newState.stems = []

    // Update the upload tracks with resulting metadata. This is used for TikTok sharing
    if (trackMetadatas) {
      newState.tracks =
        state.tracks?.map((t, i) => ({
          ...t,
          metadata: trackMetadatas[i]
        })) ?? null
    }
    return newState
  },
  [UPLOAD_TRACKS_FAILED](state: UploadState) {
    const newState = { ...state }
    newState.uploading = false
    newState.uploadType = null
    newState.tracks = null
    newState.metadata = null
    newState.stems = []
    return newState
  },
  [UPDATE_PROGRESS](
    state: UploadState,
    action: ReturnType<typeof updateProgress>
  ) {
    const newState = { ...state }
    const key = action.key
    newState.uploadProgress = [...(state.uploadProgress ?? [])]
    newState.uploadProgress[action.index][key].status = action.progress.status
    if (action.progress.loaded && action.progress.total) {
      newState.uploadProgress[action.index][key].loaded = action.progress.loaded
      newState.uploadProgress[action.index][key].total = action.progress.total
    }
    if (action.progress.transcode) {
      newState.uploadProgress[action.index][key].transcode = Math.max(
        action.progress.transcode,
        newState.uploadProgress[action.index][key].transcode ?? 0
      )
    }
    return newState
  },
  [RESET](state: UploadState) {
    return {
      ...initialState,
      openMultiTrackNotification: state.openMultiTrackNotification
    }
  },
  [RESET_STATE](state: UploadState) {
    return {
      ...state,
      shouldReset: true
    }
  },
  [UNDO_RESET_STATE](state: UploadState) {
    return {
      ...state,
      shouldReset: false
    }
  },
  [UPLOAD_SINGLE_TRACK_FAILED](
    state: UploadState,
    action: ReturnType<typeof uploadSingleTrackFailed>
  ) {
    return {
      ...state,
      failedTrackIndices: [...state.failedTrackIndices, action.index]
    }
  }
}

export default function upload(
  state = initialState,
  action: { type: keyof typeof actionsMap }
) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  // @ts-ignore action type should be a unionType of all actions in actions.ts
  return matchingReduceFunction(state, action)
}
